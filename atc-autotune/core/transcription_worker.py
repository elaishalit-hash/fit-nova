"""One-shot Whisper transcription worker, run as its own OS process.

WHY THIS EXISTS: in the packaged (PyInstaller) build, PySide6 and
ctranslate2 (faster-whisper's backend) cannot coexist in the same process -
ctranslate2 bundles its own Intel OpenMP runtime (libiomp5md.dll), and
having Qt initialized in the same process before ctranslate2 loads its model
reliably crashes with STATUS_ACCESS_VIOLATION (0xC0000005). This was
confirmed by isolating both orderings and trying the standard OpenMP-conflict
environment variables (KMP_DUPLICATE_LIB_OK, KMP_AFFINITY, OMP_NUM_THREADS) -
none prevented it. Removing ctranslate2's bundled DLL isn't an option either;
it's a hard load-time dependency of ctranslate2.dll.

The only reliable fix is process isolation: this script never imports
PySide6, so it's built as a separate PyInstaller executable that the main
GUI app launches as a subprocess per transcription request (see
core/transcription_client.py). One model load per call costs ~1-2s, which
is an acceptable trade-off for occasional ATC transmissions given the
alternative is an unfixable native crash.

Usage: transcription_worker.py <wav_path>
Prints exactly one JSON line to stdout: {"text": ..., "confidence": ...}
or {"error": "..."} - and exits.
"""

import json
import sys

from core.transcription import Transcriber
from core.wav_utils import read_wav_mono_float32


def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"error": "usage: transcription_worker.py <wav_path>"}))
        return 1

    wav_path = sys.argv[1]
    try:
        audio, rate = read_wav_mono_float32(wav_path)
        transcriber = Transcriber()
        text, confidence = transcriber.transcribe(audio, rate)
        print(json.dumps({"text": text, "confidence": confidence}))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
