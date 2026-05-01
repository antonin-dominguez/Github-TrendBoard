from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Item
from backend.ai import analyzer

router = APIRouter(prefix="/api", tags=["analysis"])

PERIOD_DAYS = {"day": 1, "week": 7, "month": 30}


@router.get("/summary")
def get_summary(
    period: str = Query("day", pattern="^(day|week|month)$"),
    db: Session = Depends(get_db),
):
    days = PERIOD_DAYS.get(period, 1)
    cutoff = datetime.utcnow() - timedelta(days=days)
    items = (
        db.query(Item)
        .filter(Item.collected_at >= cutoff)
        .order_by(Item.score.desc())
        .limit(20)
        .all()
    )

    if not items:
        return {"period": period, "summary": "Aucune donnée disponible pour cette période."}

    items_dicts = [{"source": i.source, "title": i.title, "score": i.score} for i in items]
    summary = analyzer.generate_period_summary(items_dicts, period)
    return {"period": period, "summary": summary, "item_count": len(items)}
