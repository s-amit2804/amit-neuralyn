"""Azure OpenAI Whisper transcription."""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from openai import AzureOpenAI
from pydub import AudioSegment
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_ENDPOINT,
    AZURE_WHISPER_DEPLOYMENT_NAME,
)
from .models import TranscriptionResult

logger = logging.getLogger(__name__)

_CHUNK_DURATION_MS = 10 * 60 * 1000
_AZURE_WHISPER_MAX_FILE_BYTES = 25 * 1024 * 1024


def _normalise_azure_endpoint(endpoint: str) -> str:
    """Accept either a resource root or a pasted full Azure request URL."""
    cleaned = endpoint.strip()
    if not cleaned:
        return ""

    parsed = urlparse(cleaned)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return cleaned.rstrip("/")


class Transcriber:
    """Azure-hosted Whisper wrapper."""

    _instance: Optional["Transcriber"] = None

    def __new__(cls) -> "Transcriber":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False  # type: ignore[attr-defined]
        return cls._instance

    def __init__(self) -> None:
        if self._initialised:  # type: ignore[has-type]
            return

        if not all(
            [
                AZURE_OPENAI_API_KEY,
                AZURE_OPENAI_ENDPOINT,
                AZURE_WHISPER_DEPLOYMENT_NAME,
            ]
        ):
            raise EnvironmentError(
                "Azure Whisper credentials missing. Set "
                "AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and "
                "AZURE_WHISPER_DEPLOYMENT_NAME in your .env file."
            )

        self._client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=_normalise_azure_endpoint(AZURE_OPENAI_ENDPOINT),
        )
        self._initialised = True

    def transcribe(self, audio_path: str) -> TranscriptionResult:
        """Transcribe an audio file with Azure Whisper."""
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        audio = AudioSegment.from_file(str(path))
        duration_seconds = len(audio) / 1000.0

        if path.stat().st_size <= _AZURE_WHISPER_MAX_FILE_BYTES:
            text, language = self._transcribe_single(path)
        else:
            logger.info("Audio exceeds Azure file limit; splitting into chunks.")
            text, language = self._transcribe_chunked(audio)

        return TranscriptionResult(
            text=text.strip(),
            language=language or "unknown",
            duration_seconds=round(duration_seconds, 2),
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
    def _call_api(self, file_path: Path):
        with open(file_path, "rb") as audio_file:
            return self._client.audio.transcriptions.create(
                file=audio_file,
                model=AZURE_WHISPER_DEPLOYMENT_NAME,
                response_format="verbose_json",
            )

    def _transcribe_single(self, path: Path) -> tuple[str, str]:
        result = self._call_api(path)
        return (
            getattr(result, "text", str(result)),
            getattr(result, "language", "unknown"),
        )

    def _transcribe_chunked(self, audio: AudioSegment) -> tuple[str, str]:
        chunks = [
            audio[start:start + _CHUNK_DURATION_MS]
            for start in range(0, len(audio), _CHUNK_DURATION_MS)
        ]
        texts: list[str] = []
        detected_language = "unknown"

        for index, chunk in enumerate(chunks):
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                temp_path = Path(tmp.name)
            try:
                chunk.export(str(temp_path), format="wav")
                result = self._call_api(temp_path)
                texts.append(getattr(result, "text", str(result)))
                if index == 0:
                    detected_language = getattr(result, "language", "unknown")
            finally:
                if temp_path.exists():
                    os.unlink(temp_path)

        return " ".join(texts), detected_language
