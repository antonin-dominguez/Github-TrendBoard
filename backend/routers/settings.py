import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.models import UserSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_INTERESTS = {
    "topics": [],
    "languages": [],
    "sources": ["github", "hackernews", "reddit", "devto", "huggingface"],
}

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


class InterestsPayload(BaseModel):
    topics: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    sources: Optional[list[str]] = None


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(UserSetting).filter(UserSetting.key == "interests").first()
    if not setting:
        return {"interests": DEFAULT_INTERESTS}
    try:
        return {"interests": json.loads(setting.value)}
    except json.JSONDecodeError:
        return {"interests": DEFAULT_INTERESTS}


@router.put("")
def update_settings(payload: InterestsPayload, db: Session = Depends(get_db)):
    setting = db.query(UserSetting).filter(UserSetting.key == "interests").first()
    current = DEFAULT_INTERESTS.copy()
    if setting:
        try:
            current = json.loads(setting.value)
        except json.JSONDecodeError:
            pass

    if payload.topics is not None:
        current["topics"] = payload.topics
    if payload.languages is not None:
        current["languages"] = payload.languages
    if payload.sources is not None:
        current["sources"] = payload.sources

    if setting:
        setting.value = json.dumps(current)
    else:
        db.add(UserSetting(key="interests", value=json.dumps(current)))
    db.commit()
    return {"interests": current}


@router.get("/topic-keywords")
def get_topic_keywords():
    return TOPIC_KEYWORDS
