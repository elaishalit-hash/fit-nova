"""Detect ATC frequency-change instructions in transcribed text."""

import re
from dataclasses import dataclass, field

from core.frequency_utils import extract_frequencies

# (verb_label, regex, base_confidence when matched via an unambiguous
# numeral frequency). Checked in priority order; the first match wins.
_TRIGGERS = [
    ("contact", re.compile(r"\bcontact\b")),
    ("monitor", re.compile(r"\bmonitor\b")),
    ("switch", re.compile(r"\bswitch(?:\s+to)?\b")),
    ("frequency", re.compile(r"\bfrequency\b")),
]

_STATION_STOPWORDS = {
    "on", "at", "now", "frequency", "point", "decimal", "and", "the", "a", "please",
}


@dataclass
class ATCInstruction:
    raw_text: str
    verb: str | None
    station: str | None
    frequency: float | None
    confidence: float
    all_candidates: list[float] = field(default_factory=list)


def _find_verb(text_lower: str) -> tuple[str, re.Match] | None:
    for label, pattern in _TRIGGERS:
        m = pattern.search(text_lower)
        if m:
            return label, m
    return None


def _guess_station(text_lower: str, verb_end: int) -> str | None:
    tail = text_lower[verb_end:]
    words = re.findall(r"[a-zA-Z']+", tail)
    station_words = []
    for w in words:
        if w in _STATION_STOPWORDS:
            break
        if w in ("decimal", "point"):
            break
        # stop once we hit a number word or a numeral - that's the frequency
        if re.match(r"^\d", w) or w in (
            "zero", "oh", "one", "wun", "two", "three", "tree", "four", "fower",
            "five", "fife", "six", "seven", "eight", "nine", "niner",
        ):
            break
        station_words.append(w)
        if len(station_words) >= 4:
            break
    if not station_words:
        return None
    return " ".join(station_words).title()


def parse(text: str, min_confidence: float = 0.0) -> ATCInstruction | None:
    """Parse a transcribed ATC utterance into a frequency-change instruction.

    Returns None if no recognizable trigger verb AND frequency are both
    present - plain chatter or unrelated speech should not produce an
    instruction. Confidence reflects how the frequency was extracted
    (numeral transcriptions are far less ambiguous than spelled-out words)
    and whether multiple competing frequency candidates were found.
    """
    if not text or not text.strip():
        return None

    text_lower = text.lower()
    candidates = extract_frequencies(text)
    if not candidates:
        return None

    verb_match = _find_verb(text_lower)
    if not verb_match:
        return None
    verb, match = verb_match

    frequency, source = candidates[0]
    station = _guess_station(text_lower, match.end())

    confidence = 0.85 if source == "numeral" else 0.55
    if len(candidates) > 1:
        confidence -= 0.15 * (len(candidates) - 1)
    confidence = max(0.0, min(1.0, confidence))

    instruction = ATCInstruction(
        raw_text=text,
        verb=verb,
        station=station,
        frequency=frequency,
        confidence=confidence,
        all_candidates=[f for f, _ in candidates],
    )

    if instruction.confidence < min_confidence:
        return None
    return instruction
