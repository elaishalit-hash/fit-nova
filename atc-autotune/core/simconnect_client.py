"""SimConnect bridge: read current COM frequencies from MSFS and push new ones.

Requires MSFS to be running with SimConnect enabled, and the `SimConnect`
package (community wrapper around the SimConnect SDK - see requirements.txt).

NOTE: the exact SimVar/unit and event names below are taken from the MSFS
SDK "Simulation Variables" / "Event IDs" reference and from the common usage
pattern of the `SimConnect` PyPI package. They have not been verified against
a live MSFS instance in this environment - if `_poll_once` raises or returns
unexpected values, check `python -c "from SimConnect import SimConnect"`
works and inspect the installed package's README for the exact request
string format on the version that gets installed.
"""

import logging
import threading
from dataclasses import dataclass
from typing import Callable

from SimConnect import AircraftEvents, AircraftRequests, SimConnect

from core.frequency_utils import freq_mhz_to_hz

logger = logging.getLogger(__name__)

# Requested in "MHz" units so the library returns a plain float instead of
# packed BCD16.
_ACTIVE_FREQ_SIMVAR = {
    "COM1": "COM_ACTIVE_FREQUENCY:1",
    "COM2": "COM_ACTIVE_FREQUENCY:2",
}
# Standard K:events for setting the *active* COM frequency directly, in Hz,
# with support for 8.33kHz channel spacing.
_SET_HZ_EVENT = {
    "COM1": "COM_RADIO_SET_HZ",
    "COM2": "COM2_RADIO_SET_HZ",
}

RECONNECT_INTERVAL_S = 3.0


@dataclass
class RadioState:
    com1_active_mhz: float | None = None
    com2_active_mhz: float | None = None
    connected: bool = False


class SimConnectClient:
    """Owns the SimConnect connection, polls active COM frequencies on a
    background thread, and exposes set_com_frequency() to tune a radio."""

    def __init__(
        self,
        poll_interval_s: float = 1.0,
        on_state_change: Callable[[RadioState], None] | None = None,
    ):
        self._poll_interval_s = poll_interval_s
        self._on_state_change = on_state_change
        self._sm: SimConnect | None = None
        self._aq: AircraftRequests | None = None
        self._ae: AircraftEvents | None = None
        self._state = RadioState()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    @property
    def state(self) -> RadioState:
        return self._state

    def start(self) -> None:
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)
        self._disconnect()

    def _connect(self) -> bool:
        try:
            self._sm = SimConnect()
            self._aq = AircraftRequests(self._sm, _time=200)
            self._ae = AircraftEvents(self._sm)
            self._state.connected = True
            logger.info("Connected to MSFS via SimConnect")
            return True
        except Exception as exc:
            logger.debug("SimConnect connection attempt failed (is MSFS running?): %s", exc)
            self._sm = None
            self._aq = None
            self._ae = None
            self._state.connected = False
            return False

    def _disconnect(self) -> None:
        if self._sm is not None:
            try:
                self._sm.exit()
            except Exception:
                pass
        self._sm = None
        self._aq = None
        self._ae = None
        self._state.connected = False

    def _run(self) -> None:
        while not self._stop.is_set():
            if self._sm is None and not self._connect():
                self._stop.wait(RECONNECT_INTERVAL_S)
                continue

            try:
                self._poll_once()
            except Exception as exc:
                logger.warning("Lost SimConnect connection: %s", exc)
                self._disconnect()
                self._notify()
                self._stop.wait(RECONNECT_INTERVAL_S)
                continue

            self._notify()
            self._stop.wait(self._poll_interval_s)

    def _poll_once(self) -> None:
        assert self._aq is not None
        com1 = self._aq.get(_ACTIVE_FREQ_SIMVAR["COM1"])
        com2 = self._aq.get(_ACTIVE_FREQ_SIMVAR["COM2"])
        if com1 is not None:
            self._state.com1_active_mhz = round(float(com1), 3)
        if com2 is not None:
            self._state.com2_active_mhz = round(float(com2), 3)

    def _notify(self) -> None:
        if self._on_state_change:
            self._on_state_change(self._state)

    def set_com_frequency(self, radio: str, freq_mhz: float) -> bool:
        """Set the active frequency on COM1 or COM2. Returns True if the
        event was sent (this does not guarantee the sim applied it - the
        next poll cycle confirms via the state callback)."""
        if radio not in _SET_HZ_EVENT:
            raise ValueError(f"Unknown radio {radio!r}, expected COM1 or COM2")
        if self._ae is None:
            logger.warning("Cannot set %s frequency: not connected to MSFS", radio)
            return False

        try:
            event = self._ae.find(_SET_HZ_EVENT[radio])
            event(freq_mhz_to_hz(freq_mhz))
            logger.info("Set %s active frequency to %.3f MHz", radio, freq_mhz)
            return True
        except Exception as exc:
            logger.error("Failed to set %s frequency: %s", radio, exc)
            return False
