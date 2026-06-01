"""Text normalisation — clean, language-detect, prepare for scorer.

Sits between the summariser / raw transcript and MentalRoBERTa.
"""

from __future__ import annotations

import re
import logging

from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

# ── Regex patterns for cleaning ──────────────────────────────────────────────
_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_EMAIL_RE = re.compile(r"\S+@\S+\.\S+")
_PHONE_RE = re.compile(r"\+?\d[\d\s\-]{7,}\d")
_MULTI_SPACE_RE = re.compile(r"\s+")
_SPECIAL_CHARS_RE = re.compile(r"[^\w\s.,!?;:'\"-]", re.UNICODE)


class Normaliser:
    """Lightweight text cleaner for the distress-scoring pipeline."""

    def normalise(self, text: str) -> str:
        """Clean, strip PII patterns, collapse whitespace.

        Returns lowered, trimmed text suitable for the RoBERTa tokeniser.
        """
        if not text or not text.strip():
            return ""

        cleaned = text

        # Remove URLs, emails, phone numbers (privacy + noise reduction)
        cleaned = _URL_RE.sub("", cleaned)
        cleaned = _EMAIL_RE.sub("", cleaned)
        cleaned = _PHONE_RE.sub("", cleaned)

        # Remove stray special characters but keep basic punctuation
        cleaned = _SPECIAL_CHARS_RE.sub(" ", cleaned)

        # Collapse whitespace
        cleaned = _MULTI_SPACE_RE.sub(" ", cleaned).strip()

        # Lowercase for the scorer (RoBERTa tokeniser handles casing, but
        # lowering keeps attention-weight phrase extraction consistent)
        cleaned = cleaned.lower()

        return cleaned

    def detect_language(self, text: str) -> str:
        """Best-effort language detection. Returns ISO 639-1 code."""
        try:
            return detect(text)
        except LangDetectException:
            logger.warning("Language detection failed — defaulting to 'en'.")
            return "en"
