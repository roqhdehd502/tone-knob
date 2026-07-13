import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from config import settings
from job_router import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.anthropic_api_key:
        logger.info("ANTHROPIC_API_KEY 확인됨 — TAB_GENERATION 활성화")
    else:
        logger.warning(
            "ANTHROPIC_API_KEY 미설정 — TAB_GENERATION 작업이 실패합니다. "
            "ml-server/.env에 키를 추가하세요. AUDIO_EXTRACTION은 영향 없음."
        )
    yield


app = FastAPI(
    title="Tone Knob ML Server",
    description="AI 타브 생성 (Claude API) · 오디오 추출 (Basic Pitch)",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/health")
def health():
    """서버 상태 및 기능별 활성화 여부를 반환한다."""
    return {
        "status": "ok",
        "features": {
            "tab_generation": bool(settings.anthropic_api_key),
            "audio_extraction": True,
        },
    }
