import json
import logging
import os
import time
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

SUBREDDITS = ["programming", "MachineLearning", "webdev", "devops", "opensource"]
USER_AGENT = os.getenv("REDDIT_USER_AGENT", "github-trendboard/1.0")


def _get_oauth_token(session: requests.Session) -> str | None:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    try:
        resp = session.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as e:
        logger.warning("Reddit OAuth failed: %s", e)
        return None


def _collect_subreddit_public(session: requests.Session, subreddit: str, limit: int) -> list[dict]:
    url = f"https://www.reddit.com/r/{subreddit}/hot.json"
    try:
        resp = session.get(url, params={"limit": limit}, headers={"User-Agent": USER_AGENT}, timeout=10)
        resp.raise_for_status()
        return resp.json().get("data", {}).get("children", [])
    except Exception as e:
        logger.warning("Reddit r/%s fetch failed: %s", subreddit, e)
        return []


def collect(limit_per_sub: int = 10) -> list[dict]:
    session = requests.Session()
    token = _get_oauth_token(session)

    items = []
    for subreddit in SUBREDDITS:
        time.sleep(0.5)  # respect rate limits

        if token:
            headers = {"Authorization": f"bearer {token}", "User-Agent": USER_AGENT}
            url = f"https://oauth.reddit.com/r/{subreddit}/hot"
            try:
                resp = session.get(url, params={"limit": limit_per_sub}, headers=headers, timeout=10)
                resp.raise_for_status()
                posts = resp.json().get("data", {}).get("children", [])
            except Exception as e:
                logger.warning("Reddit OAuth request failed for r/%s: %s", subreddit, e)
                posts = _collect_subreddit_public(session, subreddit, limit_per_sub)
        else:
            posts = _collect_subreddit_public(session, subreddit, limit_per_sub)

        for post in posts:
            data = post.get("data", {})
            if data.get("stickied") or not data.get("url"):
                continue

            published_at = None
            if data.get("created_utc"):
                published_at = datetime.fromtimestamp(data["created_utc"], tz=timezone.utc).replace(tzinfo=None)

            flair = data.get("link_flair_text") or ""
            tags = json.dumps([subreddit] + ([flair] if flair else []))

            items.append({
                "source": "reddit",
                "title": data.get("title", ""),
                "url": data.get("url", ""),
                "score": data.get("score", 0),
                "comments_count": data.get("num_comments", 0),
                "author": data.get("author"),
                "tags": tags,
                "language": None,
                "published_at": published_at,
            })

    logger.info("Reddit: collected %d posts", len(items))
    return items
