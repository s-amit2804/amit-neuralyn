"""Tests for the Azure Whisper transcriber."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from pydub.generators import Sine

from ml_pipeline.models import TranscriptionResult
from ml_pipeline.transcriber import Transcriber


class TestTranscriber:
    def setup_method(self):
        Transcriber._instance = None

    def test_transcribe_returns_result(self, tmp_path):
        tone = Sine(440).to_audio_segment(duration=2000)
        wav_path = tmp_path / "test_tone.wav"
        tone.export(str(wav_path), format="wav")

        fake_response = SimpleNamespace(text="I feel overwhelmed", language="en")

        with patch("ml_pipeline.transcriber.AZURE_OPENAI_API_KEY", "test-key"), \
             patch("ml_pipeline.transcriber.AZURE_OPENAI_ENDPOINT", "https://example-resource.openai.azure.com/"), \
             patch("ml_pipeline.transcriber.AZURE_WHISPER_DEPLOYMENT_NAME", "whisper"), \
             patch("ml_pipeline.transcriber.AzureOpenAI") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.audio.transcriptions.create.return_value = fake_response
            mock_client_cls.return_value = mock_client

            result = Transcriber().transcribe(str(wav_path))

        assert isinstance(result, TranscriptionResult)
        assert result.text == "I feel overwhelmed"
        assert result.language == "en"
        assert result.duration_seconds > 0

    def test_normalises_pasted_azure_endpoint(self):
        from ml_pipeline.transcriber import _normalise_azure_endpoint

        endpoint = (
            "https://demo.cognitiveservices.azure.com/openai/deployments/"
            "whisper/audio/translations?api-version=2024-06-01"
        )

        assert _normalise_azure_endpoint(endpoint) == "https://demo.cognitiveservices.azure.com"
