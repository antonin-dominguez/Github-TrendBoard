import json
import logging
import os
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://dev.to/api"


def collect(limit: int = 30) -> list[dict]:
    headers = {"User-Agent": "github-trendboard/1.0"}
    api_key = os.getenv("DEVTO_API_KEY")
    if api_key:
        headers["api-key"] = api_key

    try:
        resp = requests.get(
            f"{BASE_URL}/articles",
            params={"top": 7, "per_page": limit},
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        articles = resp.json()
    except Exception as e:
        logger.error("Dev.to fetch failed: %s", e)
        return []

    items = []
    for article in articles:
        published_at = None
        if article.get("published_at"):
            try:
                published_at = datetime.fromisoformat(article["published_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                pass

        tag_list = article.get("tag_list", [])
        tags = json.dumps(tag_list) if isinstance(tag_list, list) else "[]"

        items.append({
            "source": "devto",
            "title": article.get("title", ""),
            "url": article.get("url", ""),
            "score": article.get("public_reactions_count", 0),
            "comments_count": article.get("comments_count", 0),
            "author": article.get("user", {}).get("username"),
            "tags": tags,
            "language": None,
            "published_at": published_at,
        })

    logger.info("Dev.to: collected %d articles", len(items))
    return items
