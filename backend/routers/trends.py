from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Item, Analysis
from backend.schemas import ItemOut

router = APIRouter(prefix="/api/trends", tags=["trends"])

PERIOD_TO_SINCE = {"day": "daily", "week": "weekly", "month": "monthly"}


@router.get("", response_model=list[ItemOut])
def get_trends(
    period: str = Query("day", pattern="^(day|week|month)$"),
    source: Optional[str] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    since = PERIOD_TO_SINCE[period]
    query = db.query(Item).options(joinedload(Item.analysis)).filter(Item.trending_since == since)

    if source:
        query = query.filter(Item.source == source)
    if language:
        query = query.filter(Item.language == language)
    if search:
        query = query.filter(Item.title.ilike(f"%{search}%"))
    if category:
        query = query.join(Analysis).filter(Analysis.category == category)

    items = query.order_by(Item.score.desc()).limit(limit).all()
    return items


@router.get("/{item_id}", response_model=ItemOut)
def get_trend(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).options(joinedload(Item.analysis)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/{item_id}/analysis")
def get_or_create_analysis(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(Analysis).filter(Analysis.item_id == item_id).first()
    if existing:
        return existing

    from backend.ai import analyzer

    data = analyzer.analyze_item(
        title=item.title,
        source=item.source,
        url=item.url,
        tags=item.tags or "[]",
    )

    # keywords is already a JSON string coming from analyzer
    keywords = data.get("keywords", "[]")
    if isinstance(keywords, list):
        import json
        keywords = json.dumps(keywords)

    analysis = Analysis(
        item_id=item_id,
        summary=data.get("summary"),
        relevance_score=data.get("relevance_score"),
        category=data.get("category"),
        keywords=keywords,
        why_it_matters=data.get("why_it_matters"),
        model_used=data.get("model_used"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis
