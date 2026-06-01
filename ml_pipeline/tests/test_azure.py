"""Regression tests for downstream triage routing.

The filename is kept for compatibility with the existing workspace layout.
"""

from ml_pipeline.models import IntensityLevel, ScoringResult, TriageAction
from ml_pipeline.triage import TriagePlanner


class TestTriagePlanner:
    def setup_method(self):
        self.planner = TriagePlanner()

    def test_low_score_maps_to_self_help(self):
        result = self.planner.plan(
            ScoringResult(score=2.0, intensity=IntensityLevel.LOW, key_phrases=["stress"])
        )
        assert result.action == TriageAction.SELF_HELP

    def test_medium_score_maps_to_peer_mentor(self):
        result = self.planner.plan(
            ScoringResult(score=5.0, intensity=IntensityLevel.MEDIUM, key_phrases=["alone"])
        )
        assert result.action == TriageAction.PEER_MENTOR

    def test_high_score_maps_to_escalation(self):
        result = self.planner.plan(
            ScoringResult(score=8.8, intensity=IntensityLevel.HIGH, key_phrases=["hopeless"])
        )
        assert result.action == TriageAction.ALERT_AND_ESCALATE
