"""Extraction and validation of VHF COM frequencies from free-form ATC text.

Whisper sometimes transcribes spoken frequencies as numerals ("118.3") and
sometimes as words ("one one eight decimal three", or aviation phonetics like
"niner"/"tree"/"fife"). Both forms are handled here.
"""

import re

MIN_COM_FREQ_MHZ = 118.000
MAX_COM_FREQ_MHZ = 136.990

# Only unambiguous number-word spellings are mapped. Homophone prepositions
# ("to", "too", "for") are deliberately excluded to avoid false positives in
# ordinary ATC phraseology ("switch to...", "contact tower...").
_NUMBER_WORD_TO_DIGIT = {
    "zero": "0", "oh": "0",
    "one": "1", "wun": "1",
    "two": "2",
    "three": "3", "tree": "3",
    "four": "4", "fower": "4",
    "five": "5", "fife": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9", "niner": "9",
}
_DECIMAL_WORDS = {"point", "decimal"}

_NUMERAL_FREQ_RE = re.compile(r"\b1[1-3]\d\.\d{1,3}\b")
_WORDED_FREQ_RE = re.compile(r"\A1[1-3]\d\.\d{1,3}\Z")
# Words/letters OR a punctuation mark - punctuation forces a break so that
# e.g. "..., one two one decimal eight" doesn't fuse with digits that
# preceded the comma from an unrelated number.
_TOKEN_RE = re.compile(r"[a-zA-Z']+|[,.;:!?]")


def is_valid_com_frequency(freq_mhz: float) -> bool:
    """Whether freq_mhz falls inside the civil VHF COM airband."""
    return MIN_COM_FREQ_MHZ - 1e-6 <= freq_mhz <= MAX_COM_FREQ_MHZ + 1e-6


def format_frequency(freq_mhz: float) -> str:
    return f"{freq_mhz:.3f}"


def freq_mhz_to_hz(freq_mhz: float) -> int:
    """Convert a MHz frequency (e.g. 118.305) to whole Hz for SimConnect."""
    return round(freq_mhz * 1_000_000)


def _extract_numeral_candidates(text: str) -> list[str]:
    return _NUMERAL_FREQ_RE.findall(text)


def _extract_worded_candidates(text: str) -> list[str]:
    raw_tokens = _TOKEN_RE.findall(text.lower())
    tokens: list[str | None] = []
    for w in raw_tokens:
        if w in ",.;:!?":
            tokens.append(None)
        elif w in _NUMBER_WORD_TO_DIGIT:
            tokens.append(_NUMBER_WORD_TO_DIGIT[w])
        elif w in _DECIMAL_WORDS:
            tokens.append(".")
        else:
            tokens.append(None)

    candidates = []
    buf = ""
    for t in tokens + [None]:
        if t is None:
            if buf:
                candidates.append(buf)
            buf = ""
        else:
            buf += t

    return [c for c in candidates if _WORDED_FREQ_RE.match(c)]


def extract_frequencies(text: str) -> list[tuple[float, str]]:
    """Find all plausible COM frequency candidates in text.

    Returns a list of (frequency_mhz, source) tuples, source being
    "numeral" or "worded", in order of appearance/priority. Numeral matches
    are listed first since they are unambiguous.
    """
    results: list[tuple[float, str]] = []
    seen: set[str] = set()

    for raw in _extract_numeral_candidates(text):
        if raw not in seen:
            seen.add(raw)
            results.append((float(raw), "numeral"))

    for raw in _extract_worded_candidates(text):
        if raw not in seen:
            seen.add(raw)
            results.append((float(raw), "worded"))

    return [(f, src) for f, src in results if is_valid_com_frequency(f)]
