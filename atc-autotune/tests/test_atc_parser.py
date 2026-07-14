import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.atc_parser import parse


def test_contact_with_numeral_frequency():
    instr = parse("Delta one two three, contact Tower one one eight decimal three")
    assert instr is not None
    assert instr.verb == "contact"
    assert instr.frequency == 118.3
    assert instr.confidence > 0.4


def test_monitor_instruction():
    instr = parse("Speedbird 22, monitor Ground point eight, one two one decimal eight")
    assert instr is not None
    assert instr.verb == "monitor"
    assert instr.frequency == 121.8


def test_switch_to_instruction():
    instr = parse("switch to Approach on 125.35")
    assert instr is not None
    assert instr.verb == "switch"
    assert instr.frequency == 125.35


def test_frequency_verb():
    instr = parse("new frequency is 133.900, contact when ready")
    assert instr is not None
    assert instr.verb == "contact"
    assert instr.frequency == 133.9


def test_no_trigger_verb_returns_none():
    assert parse("roger, 118.3, thanks") is None


def test_no_frequency_returns_none():
    assert parse("contact tower when ready") is None


def test_unrelated_chatter_returns_none():
    assert parse("Cessna 123, cleared to land runway two seven") is None


def test_numeral_confidence_higher_than_worded():
    numeral = parse("contact tower 118.3")
    worded = parse("contact tower one one eight decimal three")
    assert numeral is not None and worded is not None
    assert numeral.confidence > worded.confidence


def test_min_confidence_filters_low_confidence_matches():
    # worded-form confidence (0.55) should pass a 0.5 threshold...
    assert parse("contact ground one one eight decimal three", min_confidence=0.5) is not None
    # ...but not an artificially high one
    assert parse("contact ground one one eight decimal three", min_confidence=0.9) is None


def test_station_guess_best_effort():
    instr = parse("contact Bay Approach on 125.35")
    assert instr is not None
    assert instr.station is not None
    assert "approach" in instr.station.lower()
