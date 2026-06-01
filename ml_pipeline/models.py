"""Pydantic data-transfer objects shared across the pipeline."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────
class IntensityLevel(str, Enum):
    """Distress intensity bucket derived from the 0-10 score."""

    LOW = "low"        # 0 – 3
    MEDIUM = "medium"  # 4 – 6
    HIGH = "high"      # 7 – 10


# ── Stage results ────────────────────────────────────────────────────────────
class TranscriptionResult(BaseModel):
    """Output of the Whisper transcriber."""

    text: str = Field(..., description="Transcribed text")
    language: str = Field(
        default="unknown", description="Detected language code (e.g. 'hi', 'en')"
    )
    duration_seconds: float = Field(
        default=0.0, description="Audio duration in seconds"
    )


class ScoringResult(BaseModel):
    """Output of the MentalRoBERTa distress scorer."""

    score: float = Field(
        ..., ge=0.0, le=10.0, description="Continuous distress score 0–10"
    )
    intensity: IntensityLevel = Field(
        ..., description="Bucketed intensity level"
    )
    key_phrases: list[str] = Field(
        default_factory=list,
        description="Top tokens/phrases by attention weight",
    )


class SummaryResult(BaseModel):
    """Output of the Claude Haiku session summariser."""

    summary: str = Field(..., description="Concise session summary for mentors")
    token_count: int = Field(
        default=0, description="Approximate token count of the summary"
    )


class TriageAction(str, Enum):
    """Downstream support path selected from the distress intensity."""

    SELF_HELP = "self_help"
    PEER_MENTOR = "peer_mentor"
    ALERT_AND_ESCALATE = "alert_and_escalate"


class TriageResult(BaseModel):
    """Recommended downstream action for the current session."""

    action: TriageAction = Field(..., description="Chosen support path")
    label: str = Field(..., description="Human-readable action label")
    rationale: str = Field(
        ..., description="Short explanation for why this route was selected"
    )


# ── Pipeline I/O ─────────────────────────────────────────────────────────────
class SessionInput(BaseModel):
    """Input to the pipeline — at least one of text / audio_path must be set."""

    text: Optional[str] = Field(
        default=None, description="Chat / typed session text"
    )
    audio_path: Optional[str] = Field(
        default=None, description="Path to voice-note / call-recording file"
    )


class PipelineResult(BaseModel):
    """Combined output of the full MindBridge ML pipeline."""

    transcription: Optional[TranscriptionResult] = None
    summary: Optional[SummaryResult] = None
    scoring: ScoringResult
    triage: TriageResult
    raw_text: str = Field(
        ..., description="Merged text that was fed into normalisation"
    )
    normalised_text: str = Field(
        ..., description="Cleaned text that was passed to the distress scorer"
    )
    detected_language: str = Field(
        default="unknown",
        description="Best-effort language code for the merged session content",
    )
