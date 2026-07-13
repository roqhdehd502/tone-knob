import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


async def send_webhook(url: str, secret: str | None, payload: dict[str, Any]) -> None:
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if secret:
        headers["x-ml-webhook-secret"] = secret

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(url, json=payload, headers=headers)
            if not res.is_success:
                logger.error("Webhook %s returned %d: %s", url, res.status_code, res.text)
        except Exception as exc:
            logger.error("Webhook failed [%s]: %s", url, exc)
