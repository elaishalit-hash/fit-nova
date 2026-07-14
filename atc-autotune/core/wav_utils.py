"""Minimal WAV read/write helpers with no dependency on faster-whisper.

Deliberately kept separate from core/transcription.py: the GUI process
(main.py -> transcription_client.py -> this module) must never import
faster-whisper/ctranslate2 - see transcription_worker.py's docstring for why.
"""

import wave

import numpy as np


def read_wav_mono_float32(path: str) -> tuple[np.ndarray, int]:
    """Read a 16-bit PCM WAV file as a mono float32 array in [-1, 1]."""
    with wave.open(path, "rb") as wf:
        if wf.getsampwidth() != 2:
            raise ValueError(f"expected 16-bit PCM WAV, got sample width {wf.getsampwidth()}")
        channels = wf.getnchannels()
        rate = wf.getframerate()
        raw = wf.readframes(wf.getnframes())
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        arr = arr.reshape(-1, channels).mean(axis=1)
    return arr, rate


def write_wav_mono(path: str, audio: np.ndarray, sample_rate: int) -> None:
    """Write a mono float32 [-1, 1] array out as a 16-bit PCM WAV file."""
    pcm16 = np.clip(audio * 32768.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm16.tobytes())
