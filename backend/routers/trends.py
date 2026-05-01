import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Item, Analysis, UserSetting
from backend.schemas import ItemOut

router = APIRouter(prefix="/api/trends", tags=["trends"])

PERIOD_TO_SINCE = {"day": "daily", "week": "weekly", "month": "monthly"}
PERIOD_DAYS = {"day": 1, "week": 7, "month": 30}

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "IA/ML": ["ai", "ml", "llm", "gpt", "neural", "model", "machine learning", "deep learning",
               "transformer", "diffusion", "embedding", "rag", "agent", "inference", "hugging"],
    "DevOps": ["docker", "kubernetes", "k8s", "ci", "cd", "pipeline", "deploy", "infra",
                "terraform", "ansible", "helm", "devops", "observability", "monitoring"],
    "Web": ["react", "vue", "svelte", "next", "nuxt", "frontend", "css", "html", "web",
             "browser", "tailwind", "typescript", "javascript"],
    "Sécurité": ["security", "vuln", "cve", "exploit", "auth", "crypto", "pentest",
                  "firewall", "zero-day", "encryption", "privacy"],
    "Open Source": ["open source", "open-source", "oss", "foss", "community", "contributor"],
    "Mobile": ["android", "ios", "flutter", "react native", "swift", "kotlin", "mobile"],
    "Cloud": ["aws", "gcp", "azure", "cloud", "serverless", "lambda", "s3", "fargate"],
    "Data": ["database", "sql", "nosql", "postgres", "redis", "kafka", "spark", "dbt",
              "analytics", "etl", "warehouse", "vector db"],
    "Outillage": ["cli", "tool", "productivity", "editor", "terminal", "shell", "vim",
                   "neovim", "plugin", "extension", "automation"],
}


def _get_interests(db: Session) -> dict:
    setting = db.query(UserSetting).filter(UserSetting.key == "interests").first()
    if not setting:
        return {"topics": [], "languages": [], "sources": []}
    try:
        return json.loads(setting.value)
    except json.JSONDecodeError:
        return {"topics": [], "languages": [], "sources": []}


def _interest_boost(item: Item, interests: dict) -> float:
    boost = 1.0
    languages = interests.get("languages", [])
    topics = interests.get("topics", [])

    if item.language and item.language in languages:
        boost += 0.6

    title_lower = item.title.lower()
    tags_str = (item.tags or "").lower()
    for topic in topics:
        keywords = TOPIC_KEYWORDS.get(topic, [topic.lower()])
        if any(kw in title_lower or kw in tags_str for kw in keywords):
            boost += 0.4
            break  # one topic match is enough

    return boost


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
    cutoff = datetime.utcnow() - timedelta(days=PERIOD_DAYS[period])

    # GitHub: filter by trending_since. Other sources: filter by collected_at window.
    period_filter = or_(
        and_(Item.source == "github", Item.trending_since == since),
        and_(Item.source != "github", Item.collected_at >= cutoff),
    )

    query = db.query(Item).options(joinedload(Item.analysis)).filter(period_filter)

    if source:
        query = query.filter(Item.source == source)
    if language:
        query = query.filter(Item.language == language)
    if search:
        query = query.filter(Item.title.ilike(f"%{search}%"))
    if category:
        query = query.join(Analysis).filter(Analysis.category == category)

    # Fetch more than needed to re-rank by interest
    raw_items = query.order_by(Item.score.desc()).limit(limit * 3).all()

    interests = _get_interests(db)
    has_prefs = bool(interests.get("topics") or interests.get("languages"))

    if has_prefs:
        raw_items.sort(key=lambda i: i.score * _interest_boost(i, interests), reverse=True)

    return raw_items[:limit]


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

    keywords = data.get("keywords", "[]")
    if isinstance(keywords, list):
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
