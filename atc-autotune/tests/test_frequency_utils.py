import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.frequency_utils import (
    extract_frequencies,
    format_frequency,
    freq_mhz_to_hz,
    is_valid_com_frequency,
)


def test_is_valid_com_frequency_range():
    assert is_valid_com_frequency(118.000)
    assert is_valid_com_frequency(136.990)
    assert is_valid_com_frequency(125.325)
    assert not is_valid_com_frequency(117.999)
    assert not is_valid_com_frequency(137.000)
    assert not is_valid_com_frequency(110.500)  # VOR/ILS band, not COM


def test_freq_mhz_to_hz():
    assert freq_mhz_to_hz(118.300) == 118300000
    assert freq_mhz_to_hz(120.005) == 120005000


def test_format_frequency():
    assert format_frequency(118.3) == "118.300"
    assert format_frequency(118.325) == "118.325"


def test_extract_numeral_frequency():
    results = extract_frequencies("contact Tower on 118.3 now")
    assert results == [(118.3, "numeral")]


def test_extract_worded_frequency_standard_words():
    results = extract_frequencies("contact Ground one one eight decimal three")
    assert results == [(118.3, "worded")]


def test_extract_worded_frequency_aviation_phonetics():
    results = extract_frequencies("monitor tower one two zero point tree two fife")
    assert results == [(120.325, "worded")]


def test_extract_worded_frequency_with_niner():
    results = extract_frequencies("switch to one one niner decimal eight")
    assert results == [(119.8, "worded")]


def test_no_frequency_present():
    assert extract_frequencies("roger, standby") == []


def test_ignores_out_of_band_numbers():
    # 110.5 is a VOR/ILS frequency, not a valid COM frequency
    results = extract_frequencies("cleared ILS runway one one zero point five")
    assert results == []


def test_does_not_confuse_ordinary_words_with_digits():
    # "to" and "for" must never be treated as digits 2/4
    results = extract_frequencies("switch to the tower frequency for landing 118.3")
    assert results == [(118.3, "numeral")]


def test_multiple_candidates_returns_all():
    results = extract_frequencies("contact tower 118.3, if unable monitor 121.5")
    assert (118.3, "numeral") in results
    assert (121.5, "numeral") in results
