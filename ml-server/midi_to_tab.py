"""MIDI note events → TabDocument JSON 변환기 (Basic Pitch 결과 전용)"""

import uuid
from typing import Any

# string 0 = high E (1번줄), string 5 = low E (6번줄)
_TUNING_PRESETS: dict[str, dict] = {
    "standard": {
        "notes": ["E", "B", "G", "D", "A", "E"],
        "open_midi": [64, 59, 55, 50, 45, 40],
    },
    "drop-d": {
        "notes": ["E", "B", "G", "D", "A", "D"],
        "open_midi": [64, 59, 55, 50, 45, 38],
    },
    "half-step-down": {
        "notes": ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"],
        "open_midi": [63, 58, 54, 49, 44, 39],
    },
    "open-g": {
        "notes": ["D", "B", "G", "D", "G", "D"],
        "open_midi": [62, 59, 55, 50, 43, 38],
    },
}

# TabDocument 허용 duration 값 (온음표 = 1 기준)
_VALID_DURATIONS = [1.0, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125, 0.0625, 0.03125]
_MAX_FRET = 22
_BEATS_PER_MEASURE = 4  # 4/4 박자 고정


def _snap_duration(dur: float) -> float:
    return min(_VALID_DURATIONS, key=lambda d: abs(d - dur))


def _midi_to_string_fret(
    midi_note: int, open_midi: list[int]
) -> tuple[int, int] | None:
    """주어진 MIDI 음높이에 대해 가장 낮은 프렛 위치 (string_idx, fret) 반환."""
    best: tuple[int, int] | None = None
    for string_idx, open_note in enumerate(open_midi):
        fret = midi_note - open_note
        if 0 <= fret <= _MAX_FRET:
            if best is None or fret < best[1]:
                best = (string_idx, fret)
    return best


def midi_notes_to_tab_document(
    note_events: list[tuple],
    bpm: float,
    title: str,
    artist: str,
    tuning_name: str,
) -> dict[str, Any]:
    """
    Basic Pitch note_events → TabDocument JSON.

    note_events: list of (start_time_s, end_time_s, pitch_midi, amplitude, pitch_bends)
    """
    preset = _TUNING_PRESETS.get(tuning_name, _TUNING_PRESETS["standard"])
    open_midi: list[int] = preset["open_midi"]
    tuning_notes: list[str] = preset["notes"]

    bpm = max(40.0, min(bpm, 280.0))
    beat_s = 60.0 / bpm
    whole_s = beat_s * _BEATS_PER_MEASURE  # 한 마디(4/4) 길이 (초)

    measures_dict: dict[int, list[dict]] = {}

    for start_s, end_s, midi_note, _amp, _bends in note_events:
        pos = _midi_to_string_fret(int(round(midi_note)), open_midi)
        if pos is None:
            continue
        string_idx, fret = pos

        start_whole = start_s / whole_s
        measure_idx = int(start_whole)
        position = round(start_whole - measure_idx, 4)

        dur_whole = (end_s - start_s) / whole_s
        duration = _snap_duration(max(dur_whole, _VALID_DURATIONS[-1]))

        note: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "string": string_idx,
            "fret": fret,
            "duration": duration,
            "position": position,
        }

        measures_dict.setdefault(measure_idx, []).append(note)

    if not measures_dict:
        return _empty_doc(title, artist, bpm, tuning_notes)

    max_idx = max(measures_dict)
    measures: list[dict] = []
    for i in range(max_idx + 1):
        raw_notes = measures_dict.get(i, [])
        # 같은 줄·위치 중복 제거 (마지막 항목 우선)
        seen: dict[tuple, dict] = {}
        for n in raw_notes:
            seen[(n["string"], n["position"])] = n
        measures.append({"id": str(uuid.uuid4()), "notes": list(seen.values())})

    return {
        "title": title,
        "artist": artist,
        "tuning": tuning_notes,
        "bpm": round(bpm),
        "timeSignature": [_BEATS_PER_MEASURE, 4],
        "sections": [
            {
                "id": str(uuid.uuid4()),
                "name": "Main",
                "measures": measures,
            }
        ],
    }


def _empty_doc(title: str, artist: str, bpm: float, tuning: list[str]) -> dict:
    return {
        "title": title,
        "artist": artist,
        "tuning": tuning,
        "bpm": round(bpm),
        "timeSignature": [_BEATS_PER_MEASURE, 4],
        "sections": [
            {
                "id": str(uuid.uuid4()),
                "name": "Main",
                "measures": [{"id": str(uuid.uuid4()), "notes": []}],
            }
        ],
    }
