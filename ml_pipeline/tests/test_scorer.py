"""Tests for the MentalRoBERTa distress scorer.

Mocks the HuggingFace model to avoid requiring authentication during testing.
"""

from unittest.mock import MagicMock, patch

import pytest
import torch

from ml_pipeline.models import IntensityLevel
from ml_pipeline.scorer import Scorer


@pytest.fixture(scope="module")
def mock_transformers():
    """Mock the transformers library to avoid downloading the gated model."""
    with patch("ml_pipeline.scorer.AutoTokenizer.from_pretrained") as mock_tokenizer, \
         patch("ml_pipeline.scorer.AutoModelForSequenceClassification.from_pretrained") as mock_model:
        
        # Configure mocked tokenizer
        mock_tok_instance = MagicMock()
        mock_inputs = MagicMock()
        mock_inputs.to.return_value = {
            "input_ids": torch.tensor([[1, 2, 3, 4]])
        }
        # mock_inputs acts like a dict for dictionary lookups
        mock_inputs.__getitem__.side_effect = lambda key: mock_inputs.to.return_value[key]
        mock_tok_instance.return_value = mock_inputs
        
        mock_tok_instance.convert_ids_to_tokens.return_value = ["<s>", "sad", "hopeless", "</s>"]
        mock_tokenizer.return_value = mock_tok_instance

        # Configure mocked model
        class MockModelOutput:
            def __init__(self):
                self.logits = torch.tensor([[0.1, 0.2, 5.0, 0.5, 0.1]])
                self.attentions = (torch.ones((1, 12, 4, 4)),)

        mock_model_instance = MagicMock()
        mock_model_instance.return_value = MockModelOutput()
        mock_model_instance.to.return_value = mock_model_instance
        
        mock_model.return_value = mock_model_instance
        yield


@pytest.fixture
def scorer(mock_transformers):
    """Load scorer with mocked transformers."""
    Scorer._instance = None  # Reset singleton for testing
    return Scorer()


class TestScorer:
    def test_returns_valid_score(self, scorer):
        result = scorer.score("I feel hopeless and worthless, nobody cares.")
        assert 0.0 <= result.score <= 10.0

    def test_returns_intensity_level(self, scorer):
        result = scorer.score("I am feeling very sad and alone.")
        assert result.intensity in (
            IntensityLevel.LOW,
            IntensityLevel.MEDIUM,
            IntensityLevel.HIGH,
        )

    def test_returns_key_phrases(self, scorer):
        result = scorer.score("I feel so depressed and anxious.")
        assert isinstance(result.key_phrases, list)
        assert len(result.key_phrases) > 0

    def test_empty_text_returns_zero(self, scorer):
        result = scorer.score("")
        assert result.score == 0.0
        assert result.intensity == IntensityLevel.LOW
