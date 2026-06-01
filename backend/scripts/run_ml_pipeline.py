"""Bridge script for invoking the Python ML pipeline from the Node backend."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    logging.basicConfig(level=logging.ERROR)

    from ml_pipeline.models import SessionInput
    from ml_pipeline.pipeline import MindBridgePipeline

    payload = json.load(sys.stdin)
    pipeline = MindBridgePipeline()
    result = pipeline.process(
        SessionInput(
            text=payload.get("text"),
            audio_path=payload.get("audio_path"),
        )
    )

    sys.stdout.write(result.model_dump_json())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
