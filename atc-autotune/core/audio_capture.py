"""System-audio loopback capture with a lightweight VAD segmenter.

Captures whatever MSFS/vPilot is playing through the default (or configured)
Windows output device via WASAPI loopback, and slices the stream into speech
segments using RMS-energy voice activity detection. Each finished segment is
handed to a callback as a mono float32 numpy array at config.AUDIO.sample_rate,
ready for Whisper.

If ATC audio is mixed with other simulator sounds (engine, wind, other
players) on the same output device, consider routing vPilot alone to a
virtual audio cable and pointing device_index at that instead of the main
speakers - see README.md.
"""

import logging
import threading
from typing import Callable

import numpy as np
import pyaudiowpatch as pyaudio

from config import AUDIO

logger = logging.getLogger(__name__)

SegmentCallback = Callable[[np.ndarray, int], None]


def list_loopback_devices() -> list[dict]:
    """Enumerate available WASAPI loopback devices, for picking device_index."""
    with pyaudio.PyAudio() as p:
        return list(p.get_loopback_device_info_generator())


def _find_loopback_device(p: "pyaudio.PyAudio", device_index: int | None) -> dict:
    if device_index is not None:
        return p.get_device_info_by_index(device_index)

    wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
    if default_speakers.get("isLoopbackDevice"):
        return default_speakers
    for loopback in p.get_loopback_device_info_generator():
        if default_speakers["name"] in loopback["name"]:
            return loopback
    raise RuntimeError(
        "No WASAPI loopback device found for the default output device. "
        "Pick one explicitly via AUDIO.device_index (see list_loopback_devices())."
    )


def _resample(mono: np.ndarray, src_rate: int, dst_rate: int) -> np.ndarray:
    if src_rate == dst_rate or mono.size == 0:
        return mono.astype(np.float32)
    duration = mono.shape[0] / src_rate
    dst_len = max(1, int(round(duration * dst_rate)))
    src_x = np.linspace(0, duration, num=mono.shape[0], endpoint=False)
    dst_x = np.linspace(0, duration, num=dst_len, endpoint=False)
    return np.interp(dst_x, src_x, mono).astype(np.float32)


class AudioSegmenter:
    """Captures loopback audio on a background thread and emits speech
    segments (mono float32 @ AUDIO.sample_rate) via on_segment."""

    def __init__(self, on_segment: SegmentCallback, device_index: int | None = None):
        self._on_segment = on_segment
        self._device_index = device_index if device_index is not None else AUDIO.device_index
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=3)

    def _run(self) -> None:
        try:
            with pyaudio.PyAudio() as p:
                self._capture_loop(p)
        except Exception:
            logger.exception("Audio capture thread crashed")

    def _capture_loop(self, p: "pyaudio.PyAudio") -> None:
        device = _find_loopback_device(p, self._device_index)
        channels = int(device["maxInputChannels"]) or 2
        src_rate = int(device["defaultSampleRate"])
        frame_frames = max(1, int(src_rate * AUDIO.frame_ms / 1000))

        logger.info(
            "Capturing loopback audio from '%s' (%d Hz, %d ch)",
            device["name"], src_rate, channels,
        )

        stream = p.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=src_rate,
            input=True,
            input_device_index=device["index"],
            frames_per_buffer=frame_frames,
        )

        state = "idle"
        speech_frames: list[np.ndarray] = []
        speech_ms = 0
        silence_ms = 0

        try:
            while not self._stop.is_set():
                try:
                    raw_bytes = stream.read(frame_frames, exception_on_overflow=False)
                except Exception as exc:
                    logger.warning("Audio read error, stopping capture: %s", exc)
                    break

                frame = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                if channels > 1 and frame.size >= channels and frame.size % channels == 0:
                    frame_mono = frame.reshape(-1, channels).mean(axis=1)
                else:
                    frame_mono = frame
                rms = float(np.sqrt(np.mean(frame_mono**2))) if frame_mono.size else 0.0

                if state == "idle":
                    if rms >= AUDIO.vad_start_threshold:
                        state = "speech"
                        speech_frames = [frame_mono]
                        speech_ms = AUDIO.frame_ms
                        silence_ms = 0
                else:
                    speech_frames.append(frame_mono)
                    speech_ms += AUDIO.frame_ms
                    if rms < AUDIO.vad_start_threshold:
                        silence_ms += AUDIO.frame_ms
                    else:
                        silence_ms = 0

                    if silence_ms >= AUDIO.vad_end_silence_ms or speech_ms >= AUDIO.max_segment_ms:
                        self._finish_segment(speech_frames, speech_ms, src_rate)
                        state = "idle"
                        speech_frames = []
                        speech_ms = 0
                        silence_ms = 0
        finally:
            stream.stop_stream()
            stream.close()

    def _finish_segment(self, frames: list[np.ndarray], duration_ms: int, src_rate: int) -> None:
        if duration_ms < AUDIO.min_segment_ms:
            return
        mono = np.concatenate(frames)
        resampled = _resample(mono, src_rate, AUDIO.sample_rate)
        try:
            self._on_segment(resampled, AUDIO.sample_rate)
        except Exception:
            logger.exception("on_segment callback raised")
