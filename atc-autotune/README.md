# ATC Auto-Tuner for MSFS + VATSIM

Listens to ATC audio (via vPilot on VATSIM), transcribes it locally with
Whisper, detects frequency-change instructions ("Contact...", "Monitor...",
"Switch to...", "Frequency..."), and tunes COM1/COM2 in MSFS via SimConnect -
automatically or after your confirmation.

## How it works

```
System audio (loopback) --> VAD segmenter --> transcription_worker.exe (per segment)
        --> ATC phrase parser --> [Auto: tune immediately]
                                 [Manual: show Confirm/Reject banner]
        --> SQLite log (all transmissions + frequency changes) + GUI log table
```

SimConnect is polled continuously to show COM1/COM2's current active
frequency and to reconnect automatically if MSFS restarts.

**Why transcription runs in a separate process:** PySide6 (Qt) and
ctranslate2 (faster-whisper's backend) cannot coexist in the same OS process
in a packaged build - ctranslate2 bundles its own Intel OpenMP runtime
(`libiomp5md.dll`), and if Qt has already initialized when ctranslate2 loads
a model, the process crashes with `STATUS_ACCESS_VIOLATION` (0xC0000005).
This is a native-level conflict, not a Python exception, so it can't be
caught - confirmed by isolating both orderings and by testing every standard
OpenMP-conflict environment variable (`KMP_DUPLICATE_LIB_OK`, `KMP_AFFINITY`,
`OMP_NUM_THREADS`), none of which helped. `main.py`/`gui/` never import
`faster_whisper`/`ctranslate2` - only `core/transcription_worker.py` does,
and it always runs as its own subprocess (`core/transcription_client.py`
launches it once per audio segment). Don't "simplify" this back into an
in-process call without re-testing the packaged build specifically - it
works fine unfrozen (`python main.py`) and only breaks once packaged,
which is easy to miss.

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

The window appears immediately. Each detected speech segment is sent to a
one-shot transcription subprocess (see "How it works" above), which costs
~1-2s per transmission once the model is cached locally - a worthwhile
trade-off for a crash-proof packaged build. First run downloads the model
weights, adding a one-time delay to the *first* transcription only.

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

## Packaging a standalone build (no Python required to run it)

```powershell
.venv\Scripts\pip install pyinstaller
.venv\Scripts\pyinstaller --name TranscribeWorker --console --noconfirm --paths . core\transcription_worker.py
.venv\Scripts\pyinstaller --name ATC-Autotune --windowed --noconfirm main.py
# Nest the worker build inside the main app's dist folder - transcription_client.py
# looks for it at <exe dir>\TranscribeWorker\TranscribeWorker.exe when frozen.
Copy-Item -Recurse dist\TranscribeWorker dist\ATC-Autotune\TranscribeWorker
```

The result (`dist\ATC-Autotune\`, ~400MB) is fully standalone - zip it up and
anyone on Windows can run `ATC-Autotune.exe` with no Python install. Two
separate PyInstaller builds are required (see "Why transcription runs in a
separate process" above) - a single combined build reintroduces the crash.

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
