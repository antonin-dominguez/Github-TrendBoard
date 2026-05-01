from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    item_id: int
    summary: Optional[str]
    relevance_score: Optional[int]
    category: Optional[str]
    keywords: Optional[str]
    why_it_matters: Optional[str]
    model_used: Optional[str]
    generated_at: Optional[datetime]


class ItemOut(BaseModel):
    id: int
    source: str
    title: str
    url: str
    trending_since: Optional[str]
    score: int
    comments_count: int
    author: Optional[str]
    tags: Optional[str]
    language: Optional[str]
    published_at: Optional[datetime]
    collected_at: datetime
    analysis: Optional[AnalysisOut] = None

    model_config = ConfigDict(from_attributes=True)


class FavoriteOut(BaseModel):
    id: int
    item_id: int
    noted_at: datetime
    note: Optional[str]
    item: Optional[ItemOut] = None

    model_config = ConfigDict(from_attributes=True)


class FavoriteCreate(BaseModel):
    item_id: int
    note: Optional[str] = None


class StatsOut(BaseModel):
    total_items: int
    items_today: int
    last_collection: Optional[datetime]
    sources: dict
