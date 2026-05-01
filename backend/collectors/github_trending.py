import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://github.com/trending"
SINCE_VALUES = ("daily", "weekly", "monthly")


def _parse_stars(text: str) -> int:
    text = text.strip().replace(",", "").replace(" ", "")
    if "k" in text.lower():
        return int(float(text.lower().replace("k", "")) * 1000)
    try:
        return int(text)
    except ValueError:
        return 0


def collect(language: str = "", since: str = "daily") -> list[dict]:
    if since not in SINCE_VALUES:
        since = "daily"

    url = BASE_URL
    if language:
        url += f"/{language}"

    try:
        resp = requests.get(url, params={"since": since}, timeout=15, headers={
            "User-Agent": "github-trendboard/1.0"
        })
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.error("GitHub Trending fetch failed (since=%s): %s", since, e)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    items = []

    for repo in soup.select("article.Box-row"):
        try:
            name_tag = repo.select_one("h2 a")
            if not name_tag:
                continue
            repo_path = name_tag["href"].strip("/")
            repo_url = f"https://github.com/{repo_path}"

            lang_tag = repo.select_one("[itemprop='programmingLanguage']")
            lang = lang_tag.get_text(strip=True) if lang_tag else None

            stars_tag = repo.select_one("a[href$='/stargazers']")
            stars = _parse_stars(stars_tag.get_text()) if stars_tag else 0

            author = repo_path.split("/")[0] if "/" in repo_path else None

            items.append({
                "source": "github",
                "title": repo_path,
                "url": repo_url,
                "trending_since": since,
                "score": stars,
                "comments_count": 0,
                "author": author,
                "tags": "[]",
                "language": lang,
                "published_at": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning("Error parsing GitHub repo row: %s", e)

    logger.info("GitHub Trending (%s): collected %d repos", since, len(items))
    return items


def collect_all() -> list[dict]:
    items = []
    for since in SINCE_VALUES:
        items.extend(collect(since=since))
    return items
