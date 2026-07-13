"""프롬프트 → TabDocument 생성 (Claude API)"""

import json
import logging
import re
import uuid
from typing import Any

import anthropic

from config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a professional guitarist and music notation expert.
Generate guitar tablature as a JSON object matching this exact structure:

{
  "title": "string",
  "artist": "string",
  "tuning": ["E","B","G","D","A","E"],
  "bpm": 120,
  "timeSignature": [4, 4],
  "sections": [
    {
      "id": "uuid-v4",
      "name": "Intro",
      "measures": [
        {
          "id": "uuid-v4",
          "notes": [
            {
              "id": "uuid-v4",
              "string": 2,
              "fret": 0,
              "duration": 0.25,
              "position": 0.0
            }
          ]
        }
      ]
    }
  ]
}

String numbering (6-string guitar):
  0 = high E (1st string)   3 = D (4th string)
  1 = B (2nd string)         4 = A (5th string)
  2 = G (3rd string)         5 = low E (6th string)

Fret range: 0–22

Duration — fraction of a whole note (1.0):
  1.0=whole  0.5=half  0.25=quarter  0.125=eighth  0.0625=sixteenth

Position — fraction of the measure (0.0–1.0):
  In 4/4: beat 1=0.0  beat 2=0.25  beat 3=0.5  beat 4=0.75

Rules:
- Every id field must be a unique UUID v4 string.
- No two notes in the same measure may share the same string AND position.
- Make the tab musically correct and playable on a real guitar.
- Return ONLY the raw JSON object — no markdown fences, no commentary.
"""


async def generate_tab(input_data: dict[str, Any]) -> dict[str, Any]:
    if not settings.anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY가 설정되지 않았습니다. "
            "ml-server/.env에 키를 추가한 뒤 서버를 재시작하세요."
        )

    prompt = input_data.get("prompt", "")
    genre = input_data.get("genre") or "any"
    instrument = input_data.get("instrument") or "기타"
    difficulty = input_data.get("difficulty") or "intermediate"
    measures = int(input_data.get("measures") or 8)

    user_msg = (
        f"Create a guitar tab with these parameters:\n"
        f"- Description: {prompt}\n"
        f"- Genre: {genre}\n"
        f"- Instrument: {instrument}\n"
        f"- Difficulty: {difficulty}\n"
        f"- Measures: {measures}\n\n"
        f"Generate exactly {measures} measure(s) of playable guitar tablature."
    )

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    try:
        message = await client.messages.create(
            model="claude-sonnet-5",
            max_tokens=4096,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
    except anthropic.AuthenticationError:
        raise ValueError(
            "Claude API 인증 실패 — ANTHROPIC_API_KEY가 유효하지 않습니다. "
            "Anthropic 콘솔(console.anthropic.com)에서 키를 확인하세요."
        )
    except anthropic.PermissionDeniedError:
        raise ValueError(
            "Claude API 접근 거부 — 해당 API 키에 Messages API 권한이 없습니다."
        )
    except anthropic.RateLimitError:
        raise ValueError(
            "Claude API 요청 한도 초과 — 잠시 후 재시도하세요 (429 Rate Limit)."
        )
    except anthropic.APIConnectionError as exc:
        raise ValueError(f"Claude API 연결 실패 — 네트워크 상태를 확인하세요: {exc}") from exc
    except anthropic.APIStatusError as exc:
        raise ValueError(
            f"Claude API 오류 ({exc.status_code}): {exc.message}"
        ) from exc

    raw = message.content[0].text.strip()

    # 간혹 붙는 마크다운 코드 펜스 제거
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        tab_doc = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude가 유효하지 않은 JSON을 반환했습니다: {exc}") from exc

    _fill_missing_ids(tab_doc)
    return tab_doc


def _fill_missing_ids(tab_doc: dict) -> None:
    """Claude가 id 필드를 빠뜨린 경우 UUID를 채운다."""
    for section in tab_doc.get("sections", []):
        if not section.get("id"):
            section["id"] = str(uuid.uuid4())
        for measure in section.get("measures", []):
            if not measure.get("id"):
                measure["id"] = str(uuid.uuid4())
            for note in measure.get("notes", []):
                if not note.get("id"):
                    note["id"] = str(uuid.uuid4())
