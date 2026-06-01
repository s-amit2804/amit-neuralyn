"""Downstream support routing based on the intensity score."""

from __future__ import annotations

from .models import IntensityLevel, ScoringResult, TriageAction, TriageResult


class TriagePlanner:
    """Maps low / medium / high distress into the architecture's next step."""

    def plan(self, scoring: ScoringResult) -> TriageResult:
        if scoring.intensity == IntensityLevel.LOW:
            return TriageResult(
                action=TriageAction.SELF_HELP,
                label="Self-help resources + chatbot",
                rationale=(
                    "Low-intensity sessions can stay in guided self-help flow "
                    "with reflective prompts and coping resources."
                ),
            )

        if scoring.intensity == IntensityLevel.MEDIUM:
            return TriageResult(
                action=TriageAction.PEER_MENTOR,
                label="Peer mentor matching + session",
                rationale=(
                    "Medium-intensity distress benefits from human follow-up "
                    "through mentor assignment and check-ins."
                ),
            )

        return TriageResult(
            action=TriageAction.ALERT_AND_ESCALATE,
            label="Alert + clinical escalation",
            rationale=(
                "High-intensity distress should trigger an immediate alert and "
                "escalation path to a doctor or crisis support workflow."
            ),
        )
