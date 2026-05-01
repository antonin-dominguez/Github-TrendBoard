from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base


class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        UniqueConstraint("url", "trending_since", name="uq_url_period"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    url = Column(Text, nullable=False, index=True)
    # NULL for non-GitHub sources; "daily"/"weekly"/"monthly" for GitHub
    trending_since = Column(Text, nullable=True)
    score = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    author = Column(Text)
    tags = Column(Text)   # JSON array
    language = Column(Text)
    published_at = Column(DateTime)
    collected_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="item", uselist=False)
    favorite = relationship("Favorite", back_populates="item", uselist=False)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, unique=True)
    summary = Column(Text)
    relevance_score = Column(Integer)
    category = Column(Text)
    keywords = Column(Text)   # JSON array
    why_it_matters = Column(Text)
    model_used = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("Item", back_populates="analysis")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, unique=True)
    noted_at = Column(DateTime, default=datetime.utcnow)
    note = Column(Text)

    item = relationship("Item", back_populates="favorite")


class UserSetting(Base):
    __tablename__ = "user_settings"

    key = Column(Text, primary_key=True)
    value = Column(Text, nullable=False)  # JSON
