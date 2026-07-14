"""faster-whisper wrapper: turns a captured audio segment into text.

Runs inside transcription_worker.py, in a separate OS process from the Qt
GUI - see that module's docstring for why that separation is required.
"""

import logging

import numpy as np
from faster_whisper import WhisperModel

from config import WHISPER

logger = logging.getLogger(__name__)


def _pick_device() -> str:
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count() > 0:
            return "cuda"
    except Exception:
        pass
    return "cpu"


def _default_compute_type(device: str) -> str:
    return "float16" if device == "cuda" else "int8"


class Transcriber:
    """Loads the Whisper model once and transcribes 16kHz mono float32
    audio segments produced by AudioSegmenter."""

    def __init__(self):
        device = WHISPER.device if WHISPER.device != "auto" else _pick_device()
        compute_type = (
            WHISPER.compute_type
            if WHISPER.compute_type != "default"
            else _default_compute_type(device)
        )
        logger.info(
            "Loading Whisper model '%s' on %s (%s)", WHISPER.model_size, device, compute_type
        )
        self._model = WhisperModel(WHISPER.model_size, device=device, compute_type=compute_type)

    def transcribe(self, audio: np.ndarray, sample_rate: int) -> tuple[str, float]:
        """Returns (text, confidence). confidence in [0, 1] is a rough
        estimate derived from Whisper's average log-probability and the
        no-speech probability of the transcribed segment(s) - not a
        calibrated statistic, just enough to down-weight shaky guesses."""
        if sample_rate != 16000:
            raise ValueError(f"faster-whisper expects 16kHz audio, got {sample_rate}")

        segments, _info = self._model.transcribe(
            audio,
            language=WHISPER.language,
            beam_size=5,
            vad_filter=False,
        )

        texts, logprobs, no_speech_probs = [], [], []
        for seg in segments:
            texts.append(seg.text.strip())
            logprobs.append(seg.avg_logprob)
            no_speech_probs.append(seg.no_speech_prob)

        text = " ".join(t for t in texts if t).strip()
        if not text:
            return "", 0.0

        avg_logprob = sum(logprobs) / len(logprobs) if logprobs else -1.0
        avg_no_speech = sum(no_speech_probs) / len(no_speech_probs) if no_speech_probs else 0.0
        confidence = max(0.0, min(1.0, (1.0 + avg_logprob) * (1.0 - avg_no_speech)))
        return text, confidence
