"""SQLite-backed log of ATC transmissions and COM frequency changes.

Used from multiple threads (STT worker, SimConnect poller, GUI), so all
access goes through a single connection guarded by a lock.
"""

import sqlite3
import threading
from datetime import datetime, timezone

_SCHEMA = """
CREATE TABLE IF NOT EXISTS transmissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    verb TEXT,
    station TEXT,
    frequency REAL,
    confidence REAL,
    radio TEXT,
    action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS frequency_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    radio TEXT NOT NULL,
    old_frequency REAL,
    new_frequency REAL NOT NULL,
    source TEXT NOT NULL,
    transmission_id INTEGER,
    FOREIGN KEY(transmission_id) REFERENCES transmissions(id)
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ATCLogger:
    """action values: logged_only, auto_applied, pending_confirmation,
    confirmed_applied, rejected. source values: auto, manual_confirm."""

    def __init__(self, db_path: str):
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        with self._lock:
            self._conn.executescript(_SCHEMA)
            self._conn.commit()

    def log_transmission(
        self,
        raw_text: str,
        verb: str | None,
        station: str | None,
        frequency: float | None,
        confidence: float,
        radio: str | None,
        action: str,
    ) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO transmissions "
                "(ts, raw_text, verb, station, frequency, confidence, radio, action) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (_now(), raw_text, verb, station, frequency, confidence, radio, action),
            )
            self._conn.commit()
            return cur.lastrowid

    def update_transmission_action(self, transmission_id: int, action: str) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE transmissions SET action = ? WHERE id = ?",
                (action, transmission_id),
            )
            self._conn.commit()

    def log_frequency_change(
        self,
        radio: str,
        old_frequency: float | None,
        new_frequency: float,
        source: str,
        transmission_id: int | None = None,
    ) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO frequency_changes "
                "(ts, radio, old_frequency, new_frequency, source, transmission_id) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (_now(), radio, old_frequency, new_frequency, source, transmission_id),
            )
            self._conn.commit()
            return cur.lastrowid

    def recent_transmissions(self, limit: int = 200) -> list[sqlite3.Row]:
        with self._lock:
            cur = self._conn.execute(
                "SELECT * FROM transmissions ORDER BY id DESC LIMIT ?", (limit,)
            )
            return cur.fetchall()

    def recent_frequency_changes(self, limit: int = 200) -> list[sqlite3.Row]:
        with self._lock:
            cur = self._conn.execute(
                "SELECT * FROM frequency_changes ORDER BY id DESC LIMIT ?", (limit,)
            )
            return cur.fetchall()

    def close(self) -> None:
        with self._lock:
            self._conn.close()
