"""Session summariser using the configured OpenRouter model."""

from __future__ import annotations

import logging

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import (
    CLAUDE_MODEL_ID,
    OPENROUTER_API_KEY,
    OPENROUTER_APP_NAME,
    OPENROUTER_BASE_URL,
    OPENROUTER_SITE_URL,
)
from .models import SummaryResult

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a clinical-note assistant for a youth mental-health platform called MindBridge.

Summarise the session in 3-5 sentences for a peer mentor.
- Highlight the main emotional themes.
- Mention risk or severity signals when present.
- Avoid personally identifiable information.
- Use neutral, empathetic language.
- Write the summary in English.
"""


class Summariser:
    """OpenRouter wrapper using the configured chat model."""

    def __init__(self) -> None:
        if not OPENROUTER_API_KEY:
            raise EnvironmentError(
                "OPENROUTER_API_KEY is not set. Configure it in your .env file."
            )

        self._client = OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )
        self._headers = {
            "HTTP-Referer": OPENROUTER_SITE_URL,
            "X-Title": OPENROUTER_APP_NAME,
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
    def summarise(self, session_text: str) -> SummaryResult:
        """Generate a concise mentor-facing summary."""
        if not session_text.strip():
            return SummaryResult(summary="No session text provided.", token_count=0)

        response = self._client.chat.completions.create(
            model=CLAUDE_MODEL_ID,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Summarise this session for the next peer mentor:\n\n"
                        f"{session_text}"
                    ),
                },
            ],
            max_tokens=300,
            temperature=0.2,
            extra_headers=self._headers,
        )

        summary_text = response.choices[0].message.content or ""
        usage = getattr(response, "usage", None)
        token_count = getattr(usage, "completion_tokens", 0) or 0

        return SummaryResult(
            summary=summary_text.strip(),
            token_count=token_count,
        )
