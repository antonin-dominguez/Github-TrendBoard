import logging
import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import Item
from backend.collectors import github_trending, hacker_news, reddit, devto, huggingface

logger = logging.getLogger(__name__)

COLLECT_INTERVAL_HOURS = int(os.getenv("COLLECT_INTERVAL_HOURS", "1"))
DATA_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", "90"))

_scheduler = BackgroundScheduler()
last_collection: datetime | None = None

# Sources enabled by default — can be overridden via user settings
DEFAULT_COLLECTORS = {
    "github": github_trending.collect_all,
    "hackernews": lambda: hacker_news.collect(limit=30),
    "reddit": lambda: reddit.collect(limit_per_sub=10),
    "devto": lambda: devto.collect(limit=30),
    "huggingface": lambda: huggingface.collect(limit=25),
}


def _save_items(db: Session, items: list[dict]):
    saved = 0
    seen: set[tuple] = set()
    for data in items:
        url = data.get("url")
        since = data.get("trending_since")  # None for non-GitHub
        if not url or not data.get("title"):
            continue
        key = (url, since)
        if key in seen:
            continue
        seen.add(key)

        existing = (
            db.query(Item)
            .filter(Item.url == url, Item.trending_since == since)
            .first()
        )
        if existing:
            existing.score = max(existing.score, data.get("score", 0))
            existing.comments_count = data.get("comments_count", existing.comments_count)
            existing.collected_at = datetime.utcnow()
        else:
            item = Item(**{k: v for k, v in data.items() if k not in ("description",)})
            db.add(item)
            saved += 1
    db.commit()
    return saved


def _purge_old(db: Session):
    cutoff = datetime.utcnow() - timedelta(days=DATA_RETENTION_DAYS)
    deleted = db.query(Item).filter(Item.collected_at < cutoff).delete()
    db.commit()
    if deleted:
        logger.info("Purged %d items older than %d days", deleted, DATA_RETENTION_DAYS)


def _get_enabled_sources(db: Session) -> list[str]:
    from backend.models import UserSetting
    import json
    setting = db.query(UserSetting).filter(UserSetting.key == "interests").first()
    if not setting:
        return list(DEFAULT_COLLECTORS.keys())
    try:
        interests = json.loads(setting.value)
        sources = interests.get("sources", [])
        return sources if sources else list(DEFAULT_COLLECTORS.keys())
    except (json.JSONDecodeError, AttributeError):
        return list(DEFAULT_COLLECTORS.keys())


def run_collection():
    global last_collection
    logger.info("Starting data collection...")
    db = SessionLocal()
    try:
        enabled = _get_enabled_sources(db)
        all_items = []
        for name in enabled:
            collector_fn = DEFAULT_COLLECTORS.get(name)
            if not collector_fn:
                continue
            try:
                result = collector_fn()
                all_items.extend(result)
                logger.info("Collector '%s': %d items", name, len(result))
            except Exception as e:
                logger.error("Collector '%s' failed: %s", name, e)

        saved = _save_items(db, all_items)
        _purge_old(db)
        last_collection = datetime.utcnow()
        logger.info("Collection done: %d new items (total fetched: %d)", saved, len(all_items))
    finally:
        db.close()


def start():
    _scheduler.add_job(run_collection, "interval", hours=COLLECT_INTERVAL_HOURS, id="collect")
    _scheduler.start()
    logger.info("Scheduler started (interval: %dh)", COLLECT_INTERVAL_HOURS)


def stop():
    _scheduler.shutdown(wait=False)
