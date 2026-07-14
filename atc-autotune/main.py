"""Entrypoint: wires SimConnect, audio capture, transcription, parsing,
logging and the GUI together.

IMPORTANT: Transcriber() must be constructed before QApplication. Loading
the Whisper model (ctranslate2's native init) after Qt has initialized
reliably crashes the process with STATUS_ACCESS_VIOLATION (0xC0000005) - a
real native-level conflict between ctranslate2 and PySide6, confirmed by
isolating both orderings; it happens even fully synchronously on the main
thread, so it is not a threading race, purely an init-order requirement.
Hence PySide6/gui/audio_capture/simconnect_client are only imported inside
main(), after the model has already loaded.
"""

import logging
import sys

from config import APP
from core.atc_parser import ATCInstruction, parse
from core.logger import ATCLogger
from core.transcription import Transcriber

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("atc_autotune.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("main")


class AppState:
    def __init__(self):
        self.mode = APP.default_mode
        self.target_radio = APP.default_radio


def main() -> int:
    logger.info("Loading Whisper model (first run may take a while to download weights)...")
    try:
        transcriber = Transcriber()
    except Exception:
        logger.exception("Failed to load Whisper model - audio capture will not start")
        transcriber = None

    from PySide6.QtWidgets import QApplication

    from core.audio_capture import AudioSegmenter
    from core.simconnect_client import SimConnectClient
    from gui.main_window import MainWindow

    app = QApplication(sys.argv)
    state = AppState()
    db_logger = ATCLogger(APP.db_path)

    def handle_mode_changed(mode: str) -> None:
        state.mode = mode
        logger.info("Mode changed to %s", mode)

    def handle_target_changed(radio: str) -> None:
        state.target_radio = radio
        logger.info("Auto-tune target changed to %s", radio)

    # `window` doesn't exist yet when sim_client is constructed, so route
    # through a late-bound wrapper rather than a forward reference.
    window: "MainWindow | None" = None

    def forward_radio_state(radio_state) -> None:
        if window is not None:
            window.push_radio_state(radio_state)

    sim_client = SimConnectClient(
        poll_interval_s=APP.poll_interval_s, on_state_change=forward_radio_state
    )

    def apply_frequency(
        radio: str, instruction: ATCInstruction, transmission_id: int, source: str
    ) -> None:
        old_freq = (
            sim_client.state.com1_active_mhz
            if radio == "COM1"
            else sim_client.state.com2_active_mhz
        )
        ok = sim_client.set_com_frequency(radio, instruction.frequency)
        if ok:
            db_logger.log_frequency_change(
                radio, old_freq, instruction.frequency, source, transmission_id
            )
            db_logger.update_transmission_action(
                transmission_id, "auto_applied" if source == "auto" else "confirmed_applied"
            )
        else:
            db_logger.update_transmission_action(transmission_id, "apply_failed")

    def handle_confirm(transmission_id: int, instruction: ATCInstruction) -> None:
        apply_frequency(state.target_radio, instruction, transmission_id, "manual_confirm")

    def handle_reject(transmission_id: int, _instruction: ATCInstruction) -> None:
        db_logger.update_transmission_action(transmission_id, "rejected")

    window = MainWindow(
        on_mode_changed=handle_mode_changed,
        on_target_radio_changed=handle_target_changed,
        on_confirm=handle_confirm,
        on_reject=handle_reject,
    )

    def handle_segment(audio, sample_rate) -> None:
        # Runs on the audio-capture thread.
        assert transcriber is not None
        try:
            text, stt_confidence = transcriber.transcribe(audio, sample_rate)
        except Exception:
            logger.exception("Transcription failed")
            return
        if not text:
            return
        logger.info("Heard: %r (stt_confidence=%.2f)", text, stt_confidence)

        instruction = parse(text, min_confidence=APP.min_parse_confidence)
        if instruction is None:
            return

        initial_action = "pending_confirmation" if state.mode == "manual" else "detected"
        transmission_id = db_logger.log_transmission(
            instruction.raw_text,
            instruction.verb,
            instruction.station,
            instruction.frequency,
            instruction.confidence,
            state.target_radio,
            initial_action,
        )
        window.push_instruction(instruction, transmission_id)

        if state.mode == "auto":
            apply_frequency(state.target_radio, instruction, transmission_id, "auto")

    sim_client.start()

    segmenter = None
    if transcriber is not None:
        segmenter = AudioSegmenter(on_segment=handle_segment)
        segmenter.start()
        logger.info("Listening for ATC audio.")
    else:
        logger.warning("Audio capture not started because the Whisper model failed to load.")

    window.show()
    exit_code = app.exec()

    if segmenter is not None:
        segmenter.stop()
    sim_client.stop()
    db_logger.close()
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
