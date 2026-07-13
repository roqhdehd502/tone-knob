import logging
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from audio_ext import extract_tab_from_audio
from tab_gen import generate_tab
from webhook import send_webhook

logger = logging.getLogger(__name__)
router = APIRouter()


class JobRequest(BaseModel):
    jobId: str
    type: str  # "tab_generation" | "audio_extraction"
    inputData: dict[str, Any]
    webhookUrl: str
    webhookSecret: Optional[str] = None


@router.post("/jobs", status_code=202)
async def create_job(req: JobRequest, background_tasks: BackgroundTasks):
    """ai-svc가 호출하는 작업 접수 엔드포인트. 202 즉시 반환 후 백그라운드에서 처리."""
    background_tasks.add_task(_process_job, req)
    return {"jobId": req.jobId, "status": "queued"}


async def _process_job(req: JobRequest) -> None:
    try:
        if req.type == "tab_generation":
            output = await generate_tab(req.inputData)
        elif req.type == "audio_extraction":
            output = await extract_tab_from_audio(req.inputData)
        else:
            raise ValueError(f"Unknown job type: {req.type!r}")

        await send_webhook(
            req.webhookUrl,
            req.webhookSecret,
            {"status": "completed", "outputData": output, "progress": 100},
        )

    except Exception as exc:
        logger.error("Job %s 실패: %s", req.jobId, exc, exc_info=True)
        await send_webhook(
            req.webhookUrl,
            req.webhookSecret,
            {"status": "failed", "errorMessage": str(exc)},
        )
