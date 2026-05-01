# GitHub TrendBoard

Application de veille tech locale — agrège GitHub Trending, Hacker News, Reddit et Dev.to avec analyse IA via Ollama.

## Prérequis

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installé et actif

## Installation

### 1. Cloner et configurer

```bash
git clone <repo>
cd github-trendboard
cp .env.example .env
# Éditer .env selon vos besoins
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Modèle Ollama

```bash
# Machine <= 8 Go RAM
ollama pull llama3.2:3b

# Machine >= 16 Go RAM (meilleure qualité)
ollama pull mistral:7b
```

L'interface est disponible sur http://localhost:3000

## Docker Compose (optionnel)

```bash
docker compose up --build
```

## Architecture

```
backend/
  collectors/    # GitHub, HN, Reddit, Dev.to
  ai/            # Interface Ollama
  routers/       # API REST (trends, analysis, favorites)
  main.py        # FastAPI + scheduler
frontend/
  src/
    components/  # TrendCard, FilterBar, AISummary…
    pages/       # Dashboard, Favorites
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/trends` | Liste des tendances (`period`, `source`, `category`, `search`) |
| `GET /api/trends/{id}/analysis` | Analyse IA d'un item (déclenche Ollama si absente) |
| `GET /api/summary?period=` | Résumé global IA de la période |
| `GET/POST/DELETE /api/favorites` | Gestion des favoris |
| `POST /api/refresh` | Collecte manuelle immédiate |
| `GET /api/stats` | Statistiques globales |
