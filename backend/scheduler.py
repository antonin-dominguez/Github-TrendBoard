import logging
import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import Item
from backend.collectors import github_trending

logger = logging.getLogger(__name__)

COLLECT_INTERVAL_HOURS = int(os.getenv("COLLECT_INTERVAL_HOURS", "1"))
DATA_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", "90"))

_scheduler = BackgroundScheduler()
last_collection: datetime | None = None


def _save_items(db: Session, items: list[dict]):
    saved = 0
    seen: set[tuple] = set()
    for data in items:
        url = data.get("url")
        since = data.get("trending_since", "daily")
        if not url or not data.get("title"):
            continue
        key = (url, since)
        if key in seen:
            continue
        seen.add(key)

        existing = db.query(Item).filter(Item.url == url, Item.trending_since == since).first()
        if existing:
            existing.score = max(existing.score, data.get("score", 0))
            existing.collected_at = datetime.utcnow()
        else:
            item = Item(**{k: v for k, v in data.items() if k != "description"})
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


def run_collection():
    global last_collection
    logger.info("Starting data collection (daily + weekly + monthly)...")
    db = SessionLocal()
    try:
        all_items = github_trending.collect_all()
        saved = _save_items(db, all_items)
        _purge_old(db)
        last_collection = datetime.utcnow()
        logger.info("Collection done: %d new items saved (total fetched: %d)", saved, len(all_items))
    except Exception as e:
        logger.error("Collection failed: %s", e)
    finally:
        db.close()


def start():
    _scheduler.add_job(run_collection, "interval", hours=COLLECT_INTERVAL_HOURS, id="collect")
    _scheduler.start()
    logger.info("Scheduler started (interval: %dh)", COLLECT_INTERVAL_HOURS)


def stop():
    _scheduler.shutdown(wait=False)
