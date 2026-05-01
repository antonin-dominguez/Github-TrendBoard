import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import init_db, get_db
from backend.models import Item
from backend.routers import trends, analysis, favorites, settings
from backend import scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler.start()
    scheduler.run_collection()
    yield
    scheduler.stop()


app = FastAPI(title="GitHub TrendBoard", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trends.router)
app.include_router(analysis.router)
app.include_router(favorites.router)
app.include_router(settings.router)


@app.post("/api/refresh", tags=["admin"])
def manual_refresh():
    scheduler.run_collection()
    return {"status": "ok", "triggered_at": datetime.utcnow()}


@app.get("/api/stats", tags=["admin"])
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Item).count()
    today_cutoff = datetime.utcnow() - timedelta(days=1)
    today = db.query(Item).filter(Item.collected_at >= today_cutoff).count()

    sources = {}
    for source in ["github", "hackernews", "reddit", "devto", "huggingface"]:
        sources[source] = db.query(Item).filter(Item.source == source).count()

    return {
        "total_items": total,
        "items_today": today,
        "last_collection": scheduler.last_collection,
        "sources": sources,
    }
