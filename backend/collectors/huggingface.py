import json
import logging
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://huggingface.co/api"
HEADERS = {"User-Agent": "github-trendboard/1.0"}

TASK_TO_CATEGORY = {
    "text-generation": "IA/ML",
    "text2text-generation": "IA/ML",
    "fill-mask": "IA/ML",
    "question-answering": "IA/ML",
    "summarization": "IA/ML",
    "translation": "IA/ML",
    "image-classification": "IA/ML",
    "image-to-text": "IA/ML",
    "text-to-image": "IA/ML",
    "automatic-speech-recognition": "IA/ML",
    "audio-classification": "IA/ML",
    "object-detection": "IA/ML",
    "token-classification": "IA/ML",
    "feature-extraction": "IA/ML",
    "sentence-similarity": "IA/ML",
    "reinforcement-learning": "IA/ML",
}


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _fetch(endpoint: str, params: dict) -> list[dict]:
    try:
        resp = requests.get(f"{BASE_URL}/{endpoint}", params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error("HuggingFace %s fetch failed: %s", endpoint, e)
        return []


def collect(limit: int = 25) -> list[dict]:
    items = []

    # Trending models (HF API does not support sort=trending, use likes)
    raw = _fetch("models", {"sort": "likes", "direction": -1, "limit": limit, "full": "false"})

    for m in raw:
        model_id = m.get("id", "")
        tags = m.get("tags", [])
        pipeline = m.get("pipeline_tag") or ""

        items.append({
            "source": "huggingface",
            "title": model_id,
            "url": f"https://huggingface.co/{model_id}",
            "trending_since": None,
            "score": m.get("likes", 0),
            "comments_count": 0,
            "author": model_id.split("/")[0] if "/" in model_id else None,
            "tags": json.dumps([pipeline] + tags[:5] if pipeline else tags[:5]),
            "language": None,
            "published_at": _parse_date(m.get("lastModified")),
        })

    # Trending spaces
    spaces_raw = _fetch("spaces", {"sort": "likes", "direction": -1, "limit": limit})

    for s in spaces_raw:
        space_id = s.get("id", "")
        sdk = s.get("sdk") or ""
        tags = s.get("tags", [])

        items.append({
            "source": "huggingface",
            "title": f"[Space] {space_id}",
            "url": f"https://huggingface.co/spaces/{space_id}",
            "trending_since": None,
            "score": s.get("likes", 0),
            "comments_count": 0,
            "author": space_id.split("/")[0] if "/" in space_id else None,
            "tags": json.dumps([sdk] + tags[:4] if sdk else tags[:4]),
            "language": None,
            "published_at": _parse_date(s.get("lastModified")),
        })

    logger.info("HuggingFace: collected %d items (models + spaces)", len(items))
    return items
