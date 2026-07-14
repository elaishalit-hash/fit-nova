"""Entrypoint: wires SimConnect, audio capture, transcription, parsing,
logging and the GUI together.

Transcription runs out-of-process (see core/transcription_client.py) so
this module can import PySide6 and construct QApplication normally, with
no special ordering requirements.
"""

import logging
import sys

from PySide6.QtWidgets import QApplication

from config import APP
from core.atc_parser import ATCInstruction, parse
from core.audio_capture import AudioSegmenter
from core.logger import ATCLogger
from core.simconnect_client import SimConnectClient
from core.transcription_client import TranscriptionClient
from gui.main_window import MainWindow

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
    app = QApplication(sys.argv)
    state = AppState()
    db_logger = ATCLogger(APP.db_path)
    transcriber = TranscriptionClient()

    def handle_mode_changed(mode: str) -> None:
        state.mode = mode
        logger.info("Mode changed to %s", mode)

    def handle_target_changed(radio: str) -> None:
        state.target_radio = radio
        logger.info("Auto-tune target changed to %s", radio)

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

    segmenter = AudioSegmenter(on_segment=handle_segment)
    segmenter.start()
    logger.info("Listening for ATC audio.")

    window.show()
    exit_code = app.exec()

    segmenter.stop()
    sim_client.stop()
    db_logger.close()
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
