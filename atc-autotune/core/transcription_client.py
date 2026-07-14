"""GUI-side client for the out-of-process transcription worker.

See transcription_worker.py's docstring for why transcription runs in a
separate process rather than importing faster-whisper directly here.
"""

import json
import logging
import os
import subprocess
import sys
import tempfile

import numpy as np

from core.wav_utils import write_wav_mono

logger = logging.getLogger(__name__)


def _worker_command() -> list[str]:
    if getattr(sys, "frozen", False):
        # Packaged build: TranscribeWorker.exe is bundled as a sibling
        # directory next to the main exe (see the packaging script).
        base = os.path.dirname(sys.executable)
        return [os.path.join(base, "TranscribeWorker", "TranscribeWorker.exe")]
    # Dev/source run: launch the worker module with the same interpreter.
    return [sys.executable, "-m", "core.transcription_worker"]


class TranscriptionClient:
    """Drop-in replacement for Transcriber that runs each transcription in
    a fresh subprocess. Cheap to construct - no model loading happens here."""

    def transcribe(self, audio: np.ndarray, sample_rate: int) -> tuple[str, float]:
        fd, path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        try:
            write_wav_mono(path, audio, sample_rate)
            result = subprocess.run(
                _worker_command() + [path],
                capture_output=True,
                text=True,
                timeout=60,
            )
            lines = [ln for ln in result.stdout.strip().splitlines() if ln.strip()]
            if not lines:
                raise RuntimeError(
                    f"transcription worker produced no output "
                    f"(exit {result.returncode}, stderr: {result.stderr[:500]!r})"
                )
            data = json.loads(lines[-1])
            if "error" in data:
                raise RuntimeError(f"transcription worker error: {data['error']}")
            return data["text"], data["confidence"]
        finally:
            try:
                os.remove(path)
            except OSError:
                pass
