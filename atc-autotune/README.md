# ATC Auto-Tuner for MSFS + VATSIM

Listens to ATC audio (via vPilot on VATSIM), transcribes it locally with
Whisper, detects frequency-change instructions ("Contact...", "Monitor...",
"Switch to...", "Frequency..."), and tunes COM1/COM2 in MSFS via SimConnect -
automatically or after your confirmation.

## How it works

```
System audio (loopback) --> VAD segmenter --> faster-whisper (local STT)
        --> ATC phrase parser --> [Auto: tune immediately]
                                 [Manual: show Confirm/Reject banner]
        --> SQLite log (all transmissions + frequency changes) + GUI log table
```

SimConnect is polled continuously to show COM1/COM2's current active
frequency and to reconnect automatically if MSFS restarts.

## Requirements

- Windows 10/11, MSFS running with SimConnect enabled (default).
- vPilot connected to VATSIM, audio going out through a Windows output device.
- Python 3.11+.

## Setup

```powershell
cd atc-autotune
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

The first `faster-whisper` transcription run downloads the model weights
(the default `small` model is a few hundred MB) - this needs internet once,
then everything runs fully offline/local.

## Running

```powershell
.venv\Scripts\python main.py
```

The Whisper model loads first (a couple of seconds once cached, longer on
the very first run while weights download - see console / `atc_autotune.log`
for progress), *then* the window appears. This order is required: loading
the model after Qt has initialized reliably crashes the process with a
native access violation (a real PySide6/ctranslate2 init-order conflict, not
a Python exception you can catch) - don't reorder `main.py` to load it
lazily/in the background without re-testing that.

Once the window is up, the app is listening on your default audio output
device (loopback capture - it hears whatever your speakers/headset would
play, so anything else making noise through that device, e.g. sim sounds or
music, becomes background noise picked up by the segmenter).

**For cleaner recognition**, consider routing vPilot's audio output alone to
a virtual audio device (e.g. [VB-Cable](https://vb-audio.com/Cable/)) and
setting `AUDIO.device_index` in `config.py` to that device's loopback index -
run this to list devices and their indices:

```powershell
.venv\Scripts\python -c "from core.audio_capture import list_loopback_devices; [print(d['index'], d['name']) for d in list_loopback_devices()]"
```

## Configuration

All tunables live in `config.py`:

- `WHISPER.model_size` - `tiny`/`base`/`small`/`medium`/`large-v3`. Bigger is
  more accurate but slower; `small` is a reasonable default on a CPU.
- `WHISPER.device` - `"auto"`, `"cpu"`, or `"cuda"` (if you have an NVIDIA
  GPU, `"cuda"` is much faster).
- `AUDIO.vad_start_threshold` / `vad_end_silence_ms` - tune these if speech
  segments are being cut off or noise is triggering false transcriptions.
- `APP.default_mode` - `"manual"` or `"auto"`.
- `APP.default_radio` - which radio (`COM1`/`COM2`) auto-tune targets by
  default (changeable live from the GUI dropdown too).
- `APP.min_parse_confidence` - instructions below this confidence are
  discarded before ever reaching the GUI/SimConnect.

## Known limitations (MVP)

- **Frequency parsing** handles both numeral ("118.3") and spelled-out
  ("one one eight decimal three", including aviation phonetics like
  "niner"/"tree"/"fife") forms, but real ATC phraseology is highly varied.
  Expect to need to tune `core/atc_parser.py` further after listening to
  real sessions - `all_candidates` on the returned `ATCInstruction` shows
  every frequency the parser considered, useful for debugging misparses.
- **Station name extraction** (e.g. "Tower", "Bay Approach") is a best-effort
  heuristic, not authoritative - only `verb` + `frequency` are used to decide
  whether to tune.
- **SimConnect SimVar/event names** (`COM_ACTIVE_FREQUENCY:1/2`,
  `COM_RADIO_SET_HZ`, `COM2_RADIO_SET_HZ`) are taken from the MSFS SDK
  reference and common community usage, but haven't been verified end-to-end
  against a live MSFS session in the environment this was built in - if
  reading/setting frequencies doesn't work, check `atc_autotune.log` for the
  exact error and confirm those names against the `SimConnect` package
  installed in your venv.
- Frequency is always set as the **active** frequency directly (no
  standby+swap realism) - both Auto and Manual-confirm apply immediately.
- No packaging yet (`python main.py` only) - PyInstaller packaging into a
  standalone `.exe` would be a natural next step.

## Tests

```powershell
.venv\Scripts\python -m pytest tests\ -v
```

Covers `core/frequency_utils.py` and `core/atc_parser.py` fully (pure text
in, structured instruction out - no MSFS/audio hardware needed). Audio
capture and SimConnect read/write can only be verified end-to-end on a
machine actually running MSFS + vPilot.

## Data

- `atc_log.sqlite3` - every transmission the parser recognized as a
  frequency-change instruction, plus every frequency change actually applied
  (`transmissions` / `frequency_changes` tables).
- `atc_autotune.log` - full run log, including raw Whisper transcriptions of
  every detected speech segment (useful for debugging misparses).
