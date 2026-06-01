"""MentalRoBERTa distress scorer with explainability-aware fallback."""

from __future__ import annotations

import logging
import re
from typing import Optional

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from .config import DEVICE, INTENSITY_LOW_MAX, INTENSITY_MED_MAX, MENTAL_ROBERTA_MODEL
from .models import IntensityLevel, ScoringResult

logger = logging.getLogger(__name__)

_FALLBACK_PHRASE_WEIGHTS: tuple[tuple[str, float], ...] = (
    ("kill myself", 10.0),
    ("end my life", 10.0),
    ("want to die", 9.5),
    ("suicide", 10.0),
    ("disappear", 7.5),
    ("worthless", 7.5),
    ("hopeless", 7.5),
    ("nobody cares", 7.0),
    ("all alone", 6.5),
    ("alone", 5.5),
    ("depressed", 6.0),
    ("panic", 5.5),
    ("anxious", 4.5),
    ("scared", 4.0),
    ("can't sleep", 4.0),
    ("tired of everything", 6.0),
)


class Scorer:
    """MentalRoBERTa-based distress scorer."""

    _instance: Optional["Scorer"] = None

    def __new__(cls) -> "Scorer":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False  # type: ignore[attr-defined]
        return cls._instance

    def __init__(self) -> None:
        if self._initialised:  # type: ignore[has-type]
            return
        self._tokenizer = None
        self._model = None
        self._fallback_only = False
        self._initialised = True

    def score(self, text: str) -> ScoringResult:
        """Return a distress score, intensity bucket, and salient phrases."""
        if not text.strip():
            return ScoringResult(
                score=0.0,
                intensity=IntensityLevel.LOW,
                key_phrases=[],
            )

        self._ensure_model_loaded()
        if self._fallback_only or self._tokenizer is None or self._model is None:
            return self._fallback_score(text)

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        ).to(DEVICE)

        with torch.no_grad():
            outputs = self._model(**inputs, output_attentions=True)

        logits = outputs.logits.squeeze(0)
        score = self._logits_to_score(logits)
        intensity = self._bucket(score)
        key_phrases = self._extract_key_phrases(inputs, outputs) or self._fallback_key_phrases(text)

        return ScoringResult(
            score=score,
            intensity=intensity,
            key_phrases=key_phrases,
        )

    def _ensure_model_loaded(self) -> None:
        if self._fallback_only or self._model is not None:
            return

        try:
            logger.info("Loading MentalRoBERTa model: %s", MENTAL_ROBERTA_MODEL)
            self._tokenizer = AutoTokenizer.from_pretrained(MENTAL_ROBERTA_MODEL)
            self._model = AutoModelForSequenceClassification.from_pretrained(
                MENTAL_ROBERTA_MODEL
            ).to(DEVICE)
            self._model.eval()
        except Exception as exc:
            logger.warning(
                "MentalRoBERTa could not be loaded, using fallback heuristic scorer. (%s)",
                exc,
            )
            self._fallback_only = True
            self._tokenizer = None
            self._model = None

    def _logits_to_score(self, logits: torch.Tensor) -> float:
        if logits.ndim == 0 or logits.numel() == 1:
            raw = torch.sigmoid(logits.reshape(-1)[0]).item() * 10.0
            return round(max(0.0, min(10.0, raw)), 2)

        probs = torch.softmax(logits, dim=0)
        midpoints = torch.linspace(0.5, 9.5, steps=logits.numel(), device=logits.device)
        raw = (probs * midpoints).sum().item()
        return round(max(0.0, min(10.0, raw)), 2)

    @staticmethod
    def _bucket(score: float) -> IntensityLevel:
        if score <= INTENSITY_LOW_MAX:
            return IntensityLevel.LOW
        if score <= INTENSITY_MED_MAX:
            return IntensityLevel.MEDIUM
        return IntensityLevel.HIGH

    def _extract_key_phrases(self, inputs: dict, outputs, top_k: int = 8) -> list[str]:
        try:
            if not getattr(outputs, "attentions", None):
                return []

            all_attentions = torch.stack(outputs.attentions)
            avg_attention = all_attentions.mean(dim=(0, 1, 2))
            token_importance = avg_attention.mean(dim=0)

            input_ids = inputs["input_ids"].squeeze(0)
            tokens = self._tokenizer.convert_ids_to_tokens(input_ids)

            scored_tokens: list[tuple[str, float]] = []
            for token, importance in zip(tokens, token_importance):
                if token in ("<s>", "</s>", "<pad>", "<mask>"):
                    continue
                clean = token.replace("Ġ", "").strip()
                if len(clean) > 1:
                    scored_tokens.append((clean, float(importance.item())))

            scored_tokens.sort(key=lambda item: item[1], reverse=True)
            phrases: list[str] = []
            seen: set[str] = set()
            for token, _ in scored_tokens:
                lowered = token.lower()
                if lowered not in seen:
                    seen.add(lowered)
                    phrases.append(token)
                if len(phrases) >= top_k:
                    break
            return phrases
        except Exception:
            logger.warning("Attention-based key phrase extraction failed.")
            return []

    def _fallback_score(self, text: str) -> ScoringResult:
        lowered = text.lower()
        matches = [
            (phrase, weight)
            for phrase, weight in _FALLBACK_PHRASE_WEIGHTS
            if phrase in lowered
        ]

        if matches:
            score = round(sum(weight for _, weight in matches) / len(matches), 2)
        else:
            exclamations = min(lowered.count("!"), 3) * 0.5
            negative_terms = len(re.findall(r"\b(sad|stress|stressed|cry|afraid|hurt)\b", lowered))
            score = round(min(10.0, 1.0 + exclamations + negative_terms * 1.2), 2)

        phrases = [phrase for phrase, _ in matches[:8]] or self._fallback_key_phrases(text)
        return ScoringResult(
            score=min(10.0, score),
            intensity=self._bucket(min(10.0, score)),
            key_phrases=phrases,
        )

    @staticmethod
    def _fallback_key_phrases(text: str, top_k: int = 8) -> list[str]:
        words = re.findall(r"\b[\w']+\b", text.lower())
        seen: set[str] = set()
        phrases: list[str] = []
        stop_words = {
            "the", "and", "for", "that", "with", "this", "have", "just",
            "feel", "really", "very", "about", "because", "they", "them",
        }
        for word in words:
            if len(word) <= 3 or word in stop_words or word in seen:
                continue
            seen.add(word)
            phrases.append(word)
            if len(phrases) >= top_k:
                break
        return phrases
