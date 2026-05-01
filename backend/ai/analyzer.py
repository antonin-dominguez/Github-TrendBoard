import json
import logging
import os
import re

import ollama

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

_client = ollama.Client(host=OLLAMA_HOST)

ITEM_PROMPT = """Tu es un expert en veille technologique. Analyse ce dépôt GitHub et réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans bloc markdown.

Titre : {title}
URL : {url}
Tags : {tags}

Réponds avec exactement ce JSON (remplace les valeurs) :
{{"summary":"2-3 phrases en français décrivant ce projet.","relevance_score":7,"category":"Web","keywords":["mot1","mot2","mot3"],"why_it_matters":"Une phrase sur l'impact potentiel."}}

Catégories possibles : IA/ML, DevOps, Web, Sécurité, Open Source, Mobile, Cloud, Data, Outillage, Autre"""

SUMMARY_PROMPT = """Tu es un expert en veille technologique. Voici les {count} contenus les plus populaires sur {source_label} pour la période : {period}.

{items_text}

Génère un résumé exécutif en français (5-8 phrases) qui synthétise les grandes tendances, les thèmes récurrents et les points saillants spécifiques à {source_label}. Réponds uniquement avec le texte du résumé, sans titre ni formatage."""

SOURCE_LABELS = {
    "github":      "GitHub Trending",
    "hackernews":  "Hacker News",
    "reddit":      "Reddit",
    "devto":       "Dev.to",
    "huggingface": "HuggingFace",
}


def _get_raw(response) -> str:
    if hasattr(response, "response"):
        return response.response or ""
    if isinstance(response, dict):
        return response.get("response", "")
    return str(response)


def _extract_json(text: str) -> dict | None:
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", text).strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first {...} block
    match = re.search(r"\{[\s\S]*?\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Try greedy {...} block (handles nested objects)
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


def analyze_item(title: str, source: str, url: str, tags: str = "[]") -> dict:
    prompt = ITEM_PROMPT.format(title=title, url=url, tags=tags)
    try:
        response = _client.generate(model=OLLAMA_MODEL, prompt=prompt)
        raw = _get_raw(response)
        logger.debug("Ollama raw response for '%s': %s", title, raw[:200])

        data = _extract_json(raw)
        if data is None:
            logger.warning("Could not extract JSON for '%s', using raw text", title)
            data = {
                "summary": raw.strip()[:500] or "Analyse non disponible.",
                "relevance_score": 5,
                "category": "Autre",
                "keywords": [],
                "why_it_matters": "",
            }

        data["model_used"] = OLLAMA_MODEL
        if isinstance(data.get("keywords"), list):
            data["keywords"] = json.dumps(data["keywords"])
        return data

    except Exception as e:
        logger.error("Ollama analysis failed for '%s': %s", title, e)
        raise


def generate_period_summary(items: list[dict], period: str, source: str | None = None) -> str:
    source_label = SOURCE_LABELS.get(source, "toutes les sources") if source else "toutes les sources"

    items_text = "\n".join(
        f"- [{item['source'].upper()}] {item['title']} (score: {item['score']})"
        for item in items[:20]
    )
    prompt = SUMMARY_PROMPT.format(
        count=len(items),
        period=period,
        source_label=source_label,
        items_text=items_text,
    )
    try:
        response = _client.generate(model=OLLAMA_MODEL, prompt=prompt)
        return _get_raw(response).strip()
    except Exception as e:
        logger.error("Ollama summary generation failed: %s", e)
        raise
