"""End-to-end pipeline tests for the MindBridge architecture."""

from unittest.mock import MagicMock, patch

import pytest

from ml_pipeline.models import (
    IntensityLevel,
    PipelineResult,
    ScoringResult,
    SessionInput,
    SummaryResult,
    TriageAction,
)
from ml_pipeline.pipeline import MindBridgePipeline


@pytest.fixture(scope="module")
def mock_scorer():
    with patch("ml_pipeline.pipeline.Scorer") as mock_class:
        mock_instance = MagicMock()
        mock_instance.score.return_value = ScoringResult(
            score=7.5,
            intensity=IntensityLevel.HIGH,
            key_phrases=["hopeless", "alone"],
        )
        mock_class.return_value = mock_instance
        yield


@pytest.fixture
def pipeline(mock_scorer):
    return MindBridgePipeline()


class TestPipeline:
    def test_text_only_pipeline(self, pipeline):
        session = SessionInput(
            text=(
                "I don't know what to do anymore. School is so stressful and "
                "nobody understands. I feel alone and worthless."
            )
        )

        mock_summary = SummaryResult(
            summary="Student reports academic stress, loneliness, and hopelessness.",
            token_count=14,
        )
        with patch.object(pipeline, "_get_summariser") as mock_get:
            mock_summariser = MagicMock()
            mock_summariser.summarise.return_value = mock_summary
            mock_get.return_value = mock_summariser
            result = pipeline.process(session)

        assert isinstance(result, PipelineResult)
        assert result.transcription is None
        assert result.summary == mock_summary
        assert isinstance(result.detected_language, str)
        assert result.detected_language
        assert result.triage.action == TriageAction.ALERT_AND_ESCALATE
        assert result.normalised_text == result.normalised_text.lower()

    def test_empty_input_raises(self, pipeline):
        with pytest.raises(ValueError, match="at least"):
            pipeline.process(SessionInput())

    def test_summary_is_optional_when_provider_unavailable(self, pipeline):
        session = SessionInput(text="I feel overwhelmed and cannot cope.")
        with patch.object(
            pipeline,
            "_get_summariser",
            side_effect=EnvironmentError("missing OpenRouter key"),
        ):
            result = pipeline.process(session)

        assert result.summary is None
        assert isinstance(result.scoring.key_phrases, list)
