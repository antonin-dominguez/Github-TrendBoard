import logging
from datetime import datetime, timezone
import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://hacker-news.firebaseio.com/v0"


def _fetch_item(item_id: int, session: requests.Session) -> dict | None:
    try:
        resp = session.get(f"{BASE_URL}/item/{item_id}.json", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning("HN item %d fetch failed: %s", item_id, e)
        return None


def collect(limit: int = 30) -> list[dict]:
    session = requests.Session()
    session.headers["User-Agent"] = "github-trendboard/1.0"

    try:
        resp = session.get(f"{BASE_URL}/topstories.json", timeout=10)
        resp.raise_for_status()
        story_ids = resp.json()[:limit]
    except Exception as e:
        logger.error("HN top stories fetch failed: %s", e)
        return []

    items = []
    for story_id in story_ids:
        data = _fetch_item(story_id, session)
        if not data or data.get("type") != "story":
            continue
        url = data.get("url", f"https://news.ycombinator.com/item?id={story_id}")
        published_at = None
        if data.get("time"):
            published_at = datetime.fromtimestamp(data["time"], tz=timezone.utc).replace(tzinfo=None)

        items.append({
            "source": "hackernews",
            "title": data.get("title", ""),
            "url": url,
            "score": data.get("score", 0),
            "comments_count": data.get("descendants", 0),
            "author": data.get("by"),
            "tags": "[]",
            "language": None,
            "published_at": published_at,
        })

    logger.info("Hacker News: collected %d stories", len(items))
    return items
