"""Tests for the Claude Haiku summariser via OpenRouter."""

from types import SimpleNamespace
from unittest.mock import patch

from ml_pipeline.models import SummaryResult
from ml_pipeline.summariser import Summariser


class TestSummariser:
    def test_summarise_returns_result(self):
        fake_response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content="Student reports exam stress, loneliness, and poor sleep."
                    )
                )
            ],
            usage=SimpleNamespace(completion_tokens=22),
        )

        with patch("ml_pipeline.summariser.OPENROUTER_API_KEY", "test-key"), \
             patch("ml_pipeline.summariser.OpenAI") as mock_openai:
            mock_openai.return_value.chat.completions.create.return_value = fake_response
            result = Summariser().summarise("I feel stressed and can't sleep.")

        assert isinstance(result, SummaryResult)
        assert "stress" in result.summary.lower()
        assert result.token_count == 22

    def test_empty_input(self):
        with patch("ml_pipeline.summariser.OPENROUTER_API_KEY", "test-key"), \
             patch("ml_pipeline.summariser.OpenAI"):
            result = Summariser().summarise("")

        assert result.summary == "No session text provided."
        assert result.token_count == 0
