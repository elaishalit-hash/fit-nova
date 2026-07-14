"""PySide6 GUI for the ATC auto-tuner.

Audio capture, transcription and SimConnect all run on background threads.
Qt signals are the hand-off point: they may be emitted from any thread, and
Qt automatically marshals the connected slot call onto this window's thread
(the GUI thread), so all the `_apply_*` / `_on_*` slot methods below can
safely touch widgets directly.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Callable

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QComboBox,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QMainWindow,
    QPushButton,
    QRadioButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from config import APP
from core.atc_parser import ATCInstruction
from core.frequency_utils import format_frequency
from core.simconnect_client import RadioState

logger = logging.getLogger(__name__)

_LOG_COLUMNS = ["Time", "Verb", "Station", "Frequency", "Confidence", "Action"]


class MainWindow(QMainWindow):
    radio_state_updated = Signal(object)        # RadioState
    instruction_received = Signal(object, int)  # ATCInstruction, transmission_id

    def __init__(
        self,
        on_mode_changed: Callable[[str], None] | None = None,
        on_target_radio_changed: Callable[[str], None] | None = None,
        on_confirm: Callable[[int, ATCInstruction], None] | None = None,
        on_reject: Callable[[int, ATCInstruction], None] | None = None,
    ):
        super().__init__()
        self.setWindowTitle("ATC Auto-Tuner")
        self.resize(600, 480)

        self._on_mode_changed = on_mode_changed
        self._on_target_radio_changed = on_target_radio_changed
        self._on_confirm = on_confirm
        self._on_reject = on_reject

        self._pending_transmission_id: int | None = None
        self._pending_instruction: ATCInstruction | None = None

        self._build_ui()

        self.radio_state_updated.connect(self._apply_radio_state)
        self.instruction_received.connect(self._apply_instruction)

    def _build_ui(self) -> None:
        central = QWidget()
        layout = QVBoxLayout(central)

        freq_row = QHBoxLayout()
        self.com1_label = QLabel("COM1: ---.---")
        self.com2_label = QLabel("COM2: ---.---")
        self.conn_label = QLabel("MSFS: disconnected")
        for w in (self.com1_label, self.com2_label):
            w.setStyleSheet("font-size: 16px; font-weight: 600;")
        self.conn_label.setStyleSheet("font-size: 16px; font-weight: 600; color: crimson;")
        freq_row.addWidget(self.com1_label)
        freq_row.addWidget(self.com2_label)
        freq_row.addStretch()
        freq_row.addWidget(self.conn_label)
        layout.addLayout(freq_row)

        mode_row = QHBoxLayout()
        self.manual_radio = QRadioButton("Manual")
        self.auto_radio = QRadioButton("Auto")
        if APP.default_mode == "auto":
            self.auto_radio.setChecked(True)
        else:
            self.manual_radio.setChecked(True)
        self.manual_radio.toggled.connect(self._mode_toggled)
        mode_row.addWidget(QLabel("Mode:"))
        mode_row.addWidget(self.manual_radio)
        mode_row.addWidget(self.auto_radio)

        mode_row.addSpacing(20)
        mode_row.addWidget(QLabel("Auto-tune target:"))
        self.target_combo = QComboBox()
        self.target_combo.addItems(["COM1", "COM2"])
        self.target_combo.setCurrentText(APP.default_radio)
        self.target_combo.currentTextChanged.connect(self._target_changed)
        mode_row.addWidget(self.target_combo)
        mode_row.addStretch()
        layout.addLayout(mode_row)

        self.banner = QWidget()
        banner_layout = QHBoxLayout(self.banner)
        self.banner_label = QLabel("")
        self.confirm_btn = QPushButton("Confirm")
        self.reject_btn = QPushButton("Reject")
        self.confirm_btn.clicked.connect(self._confirm_clicked)
        self.reject_btn.clicked.connect(self._reject_clicked)
        banner_layout.addWidget(self.banner_label)
        banner_layout.addStretch()
        banner_layout.addWidget(self.confirm_btn)
        banner_layout.addWidget(self.reject_btn)
        self.banner.setVisible(False)
        layout.addWidget(self.banner)

        self.log_table = QTableWidget(0, len(_LOG_COLUMNS))
        self.log_table.setHorizontalHeaderLabels(_LOG_COLUMNS)
        self.log_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.log_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.log_table)

        self.setCentralWidget(central)

    # --- mode/target callbacks ---------------------------------------------

    def _mode_toggled(self, _checked: bool) -> None:
        mode = self.current_mode()
        if self._on_mode_changed:
            self._on_mode_changed(mode)
        if mode == "auto":
            self.banner.setVisible(False)
            self._pending_transmission_id = None
            self._pending_instruction = None

    def _target_changed(self, radio: str) -> None:
        if self._on_target_radio_changed:
            self._on_target_radio_changed(radio)

    def current_mode(self) -> str:
        return "auto" if self.auto_radio.isChecked() else "manual"

    # --- thread-safe update entry points (call from any thread) ------------

    def push_radio_state(self, state: RadioState) -> None:
        self.radio_state_updated.emit(state)

    def push_instruction(self, instruction: ATCInstruction, transmission_id: int) -> None:
        self.instruction_received.emit(instruction, transmission_id)

    def append_log_row(
        self,
        ts: str,
        verb: str | None,
        station: str | None,
        frequency: float | None,
        confidence: float,
        action: str,
    ) -> None:
        row = self.log_table.rowCount()
        self.log_table.insertRow(row)
        values = [
            ts,
            verb or "",
            station or "",
            format_frequency(frequency) if frequency is not None else "",
            f"{confidence:.2f}",
            action,
        ]
        for col, value in enumerate(values):
            self.log_table.setItem(row, col, QTableWidgetItem(value))
        self.log_table.scrollToBottom()

    # --- slots (always run on the GUI thread) -------------------------------

    def _apply_radio_state(self, state: RadioState) -> None:
        if state.com1_active_mhz is not None:
            self.com1_label.setText(f"COM1: {format_frequency(state.com1_active_mhz)}")
        if state.com2_active_mhz is not None:
            self.com2_label.setText(f"COM2: {format_frequency(state.com2_active_mhz)}")
        self.conn_label.setText("MSFS: connected" if state.connected else "MSFS: disconnected")
        color = "green" if state.connected else "crimson"
        self.conn_label.setStyleSheet(f"font-size: 16px; font-weight: 600; color: {color};")

    def _apply_instruction(self, instruction: ATCInstruction, transmission_id: int) -> None:
        mode = self.current_mode()
        self.append_log_row(
            datetime.now().strftime("%H:%M:%S"),
            instruction.verb,
            instruction.station,
            instruction.frequency,
            instruction.confidence,
            "auto" if mode == "auto" else "pending",
        )
        if mode == "manual":
            self._pending_transmission_id = transmission_id
            self._pending_instruction = instruction
            self.banner_label.setText(
                f"Detected: {instruction.verb} {instruction.station or ''} "
                f"{format_frequency(instruction.frequency)}".strip()
            )
            self.banner.setVisible(True)

    def _confirm_clicked(self) -> None:
        if self._pending_transmission_id is not None and self._pending_instruction is not None and self._on_confirm:
            self._on_confirm(self._pending_transmission_id, self._pending_instruction)
        self.banner.setVisible(False)
        self._pending_transmission_id = None
        self._pending_instruction = None

    def _reject_clicked(self) -> None:
        if self._pending_transmission_id is not None and self._pending_instruction is not None and self._on_reject:
            self._on_reject(self._pending_transmission_id, self._pending_instruction)
        self.banner.setVisible(False)
        self._pending_transmission_id = None
        self._pending_instruction = None
