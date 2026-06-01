"""Centralised configuration for the MindBridge ML pipeline."""

from __future__ import annotations

import os
from pathlib import Path

import torch
from dotenv import load_dotenv

# ── Load .env from project root ──────────────────────────────────────────────
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

# ── Azure OpenAI (Whisper large-v3) ──────────────────────────────────────────
AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_WHISPER_DEPLOYMENT_NAME: str = os.getenv("AZURE_WHISPER_DEPLOYMENT_NAME", "")
AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01")

# ── OpenRouter LLM ───────────────────────────────────────────────────────────
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = os.getenv(
    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
)
OPENROUTER_APP_NAME: str = os.getenv("OPENROUTER_APP_NAME", "MindBridge")
OPENROUTER_SITE_URL: str = os.getenv(
    "OPENROUTER_SITE_URL", "https://mindbridge.local"
)
CLAUDE_MODEL_ID: str = os.getenv("CLAUDE_MODEL_ID", "qwen3.5-397b-a17b")

# ── Device selection ─────────────────────────────────────────────────────────
DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

# ── MentalRoBERTa ────────────────────────────────────────────────────────────
MENTAL_ROBERTA_MODEL: str = os.getenv(
    "MENTAL_ROBERTA_MODEL", "mental/mental-roberta-base"
)

# ── Intensity thresholds (distress score 0-10) ───────────────────────────────
INTENSITY_LOW_MAX: float = 3.0   # 0 – 3  → Low
INTENSITY_MED_MAX: float = 6.0   # 4 – 6  → Medium
                                  # 7 – 10 → High
