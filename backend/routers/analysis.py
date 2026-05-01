from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Item
from backend.ai import analyzer

router = APIRouter(prefix="/api", tags=["analysis"])

PERIOD_DAYS    = {"day": 1, "week": 7, "month": 30}
PERIOD_TO_SINCE = {"day": "daily", "week": "weekly", "month": "monthly"}


@router.get("/summary")
def get_summary(
    period: str = Query("day", pattern="^(day|week|month)$"),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    since  = PERIOD_TO_SINCE[period]
    cutoff = datetime.utcnow() - timedelta(days=PERIOD_DAYS[period])

    period_filter = or_(
        and_(Item.source == "github", Item.trending_since == since),
        and_(Item.source != "github", Item.collected_at >= cutoff),
    )

    query = db.query(Item).filter(period_filter)

    if source:
        query = query.filter(Item.source == source)

    items = query.order_by(Item.score.desc()).limit(20).all()

    if not items:
        src_label = source or "toutes les sources"
        return {"period": period, "source": source, "summary": f"Aucune donnée disponible ({src_label}, {period}).", "item_count": 0}

    items_dicts = [{"source": i.source, "title": i.title, "score": i.score} for i in items]
    summary_text = analyzer.generate_period_summary(items_dicts, period, source=source)
    return {"period": period, "source": source, "summary": summary_text, "item_count": len(items)}
