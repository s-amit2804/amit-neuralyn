"""Tests for the text normaliser."""

from ml_pipeline.normaliser import Normaliser


class TestNormaliser:
    def setup_method(self):
        self.norm = Normaliser()

    def test_empty_string(self):
        assert self.norm.normalise("") == ""
        assert self.norm.normalise("   ") == ""

    def test_url_removal(self):
        text = "check out https://example.com for more info"
        result = self.norm.normalise(text)
        assert "https" not in result
        assert "example.com" not in result

    def test_email_removal(self):
        text = "contact me at user@example.com please"
        result = self.norm.normalise(text)
        assert "@" not in result

    def test_phone_removal(self):
        text = "call me at +91 98765 43210 okay"
        result = self.norm.normalise(text)
        assert "98765" not in result

    def test_whitespace_collapse(self):
        text = "i   feel    so    alone"
        result = self.norm.normalise(text)
        assert "  " not in result
        assert result == "i feel so alone"

    def test_lowercasing(self):
        text = "I Feel SO BAD"
        result = self.norm.normalise(text)
        assert result == "i feel so bad"

    def test_preserves_emotional_content(self):
        text = "I feel worthless, hopeless, and nobody cares about me"
        result = self.norm.normalise(text)
        assert "worthless" in result
        assert "hopeless" in result
        assert "nobody cares" in result

    def test_language_detection(self):
        english = self.norm.detect_language("I feel very sad today")
        assert english == "en"
