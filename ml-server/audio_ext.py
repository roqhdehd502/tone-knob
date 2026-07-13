"""오디오 파일 → TabDocument 추출 (Basic Pitch + librosa)"""

import asyncio
import logging
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import httpx

from midi_to_tab import midi_notes_to_tab_document

logger = logging.getLogger(__name__)

# CPU-bound Basic Pitch 작업용 스레드 풀 (단일 워커 — OCI ARM 4vCPU 기준)
_executor = ThreadPoolExecutor(max_workers=1)


async def extract_tab_from_audio(input_data: dict[str, Any]) -> dict[str, Any]:
    audio_url: str = input_data.get("audioUrl", "")
    instrument: str = input_data.get("instrument") or "guitar"
    tuning: str = input_data.get("tuning") or "standard"

    suffix = _infer_suffix(audio_url)
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(tmp_fd)

    try:
        await _download_audio(audio_url, tmp_path)

        loop = asyncio.get_event_loop()
        result: dict[str, Any] = await loop.run_in_executor(
            _executor, _run_basic_pitch, tmp_path, instrument, tuning
        )
        return result
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


async def _download_audio(url: str, dest: str) -> None:
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as res:
            res.raise_for_status()
            with open(dest, "wb") as fp:
                async for chunk in res.aiter_bytes(65536):
                    fp.write(chunk)


def _run_basic_pitch(audio_path: str, instrument: str, tuning_name: str) -> dict:
    """스레드 풀에서 실행되는 동기 CPU-bound 함수."""
    import librosa
    from basic_pitch import ICASSP_2022_MODEL_PATH
    from basic_pitch.inference import predict

    # BPM 감지
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    tempo_result, _ = librosa.beat.beat_track(y=y, sr=sr)
    try:
        bpm = float(tempo_result[0])
    except (TypeError, IndexError):
        bpm = float(tempo_result)
    bpm = max(40.0, min(bpm, 280.0))

    logger.info("BPM 감지: %.1f, 오디오 길이: %.1f초", bpm, len(y) / sr)

    # Basic Pitch 추론
    _, _, note_events = predict(audio_path, ICASSP_2022_MODEL_PATH)

    logger.info("추출된 MIDI 노트 수: %d", len(note_events))

    title = f"Extracted Tab ({instrument})"
    return midi_notes_to_tab_document(
        note_events=note_events,
        bpm=bpm,
        title=title,
        artist="",
        tuning_name=tuning_name,
    )


def _infer_suffix(url: str) -> str:
    path = url.split("?")[0].lower()
    for ext in (".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".opus"):
        if path.endswith(ext):
            return ext
    return ".mp3"
