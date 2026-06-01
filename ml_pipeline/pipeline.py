"""MindBridge ML pipeline orchestrator."""

from __future__ import annotations

import logging

from .models import PipelineResult, SessionInput
from .normaliser import Normaliser
from .scorer import Scorer
from .triage import TriagePlanner

logger = logging.getLogger(__name__)


class MindBridgePipeline:
    """End-to-end flow: audio/text -> summary + distress score + triage."""

    def __init__(self) -> None:
        self._normaliser = Normaliser()
        self._scorer = Scorer()
        self._triage = TriagePlanner()
        self._transcriber = None
        self._summariser = None

    def _get_transcriber(self):
        if self._transcriber is None:
            from .transcriber import Transcriber

            self._transcriber = Transcriber()
        return self._transcriber

    def _get_summariser(self):
        if self._summariser is None:
            from .summariser import Summariser

            self._summariser = Summariser()
        return self._summariser

    def process(self, session: SessionInput) -> PipelineResult:
        """Run the architecture described in Task.md."""
        if not session.text and not session.audio_path:
            raise ValueError("SessionInput must have at least `text` or `audio_path`.")

        transcription_result = None
        summary_result = None
        parts: list[str] = []

        if session.audio_path:
            logger.info("Transcribing audio locally with Whisper: %s", session.audio_path)
            transcription_result = self._get_transcriber().transcribe(session.audio_path)
            if transcription_result.text:
                parts.append(transcription_result.text)

        if session.text:
            parts.append(session.text)

        merged_text = "\n\n".join(part for part in parts if part).strip()
        normalised_text = self._normaliser.normalise(merged_text)

        detected_language = (
            transcription_result.language
            if transcription_result and transcription_result.language != "unknown"
            else self._normaliser.detect_language(merged_text)
        )

        try:
            logger.info("Generating session summary via Claude Haiku on OpenRouter")
            summary_result = self._get_summariser().summarise(merged_text)
        except Exception as exc:
            logger.warning("Summariser unavailable, skipping summary generation. (%s)", exc)

        logger.info("Scoring session distress with MentalRoBERTa")
        scoring_result = self._scorer.score(normalised_text)
        triage_result = self._triage.plan(scoring_result)

        return PipelineResult(
            transcription=transcription_result,
            summary=summary_result,
            scoring=scoring_result,
            triage=triage_result,
            raw_text=merged_text,
            normalised_text=normalised_text,
            detected_language=detected_language,
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")

    sample_text = (
        "I don't know what to do anymore. School is so stressful and nobody "
        "understands. My parents keep fighting and I feel invisible. "
        "Sometimes I just want to disappear. I feel so alone and worthless."
    )

    result = MindBridgePipeline().process(SessionInput(text=sample_text))

    print(f"Score: {result.scoring.score}/10")
    print(f"Intensity: {result.scoring.intensity.value}")
    print(f"Triage: {result.triage.label}")
    print(f"Key phrases: {', '.join(result.scoring.key_phrases)}")
    if result.summary:
        print(f"Summary: {result.summary.summary}")
