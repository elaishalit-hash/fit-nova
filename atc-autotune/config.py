"""Central configuration for the ATC auto-tuner."""

from dataclasses import dataclass


@dataclass
class WhisperConfig:
    model_size: str = "small"       # tiny / base / small / medium / large-v3
    device: str = "auto"            # "auto" picks cuda if available, else cpu
    compute_type: str = "default"   # faster-whisper compute type
    language: str = "en"


@dataclass
class AudioConfig:
    device_index: int | None = None  # None = default WASAPI loopback (render) device
    sample_rate: int = 16000
    frame_ms: int = 30               # analysis frame size for VAD
    vad_start_threshold: float = 0.02   # RMS level that starts a segment
    vad_end_silence_ms: int = 600       # trailing silence needed to end a segment
    min_segment_ms: int = 300           # discard segments shorter than this (noise)
    max_segment_ms: int = 8000          # force-cut a segment after this long


@dataclass
class AppConfig:
    default_mode: str = "manual"     # "manual" or "auto"
    default_radio: str = "COM1"      # "COM1" or "COM2" - which radio auto-tune targets
    min_parse_confidence: float = 0.5
    poll_interval_s: float = 1.0     # SimConnect polling interval
    db_path: str = "atc_log.sqlite3"


WHISPER = WhisperConfig()
AUDIO = AudioConfig()
APP = AppConfig()
