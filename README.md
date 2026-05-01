# TrendBoard

Application de veille tech locale — agrège et analyse les tendances de **GitHub**, **Hacker News**, **Reddit**, **Dev.to** et **HuggingFace**, enrichies par un LLM local via **Ollama**.

## Fonctionnalités

- **5 sources** : GitHub Trending (daily/weekly/monthly), Hacker News, Reddit, Dev.to, HuggingFace (modèles + Spaces)
- **Centres d'intérêt** : sujets (IA/ML, DevOps, Web…) et langages préférés pour remonter les contenus les plus pertinents en tête
- **Analyse IA à la demande** : résumé, score de pertinence, mots-clés et impact potentiel générés localement par Ollama
- **Synthèse IA par source** : résumé global des tendances de la période, filtré par source sélectionnée
- **Favoris** : marquez des items et retrouvez-les dans un espace dédié
- **Export Markdown** : copiez un digest formaté en un clic
- **Collecte automatique** toutes les heures avec déduplication et purge des données de plus de 90 jours

## Stack

| Couche | Technologies |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, SQLite, APScheduler |
| Frontend | React 18, Vite, Tailwind CSS, Radix UI, lucide-react, sonner |
| IA locale | Ollama (`llama3.2:3b` ou `mistral:7b`) |
| Conteneurisation | Docker Compose |

## Démarrage rapide (Docker)

```bash
git clone <repo>
cd github-trendboard
cp .env.example .env

docker compose up -d --build
```

Puis téléchargez le modèle Ollama (une seule fois) :

```bash
# Machines ≤ 8 Go RAM
docker compose exec ollama ollama pull llama3.2:3b

# Machines ≥ 16 Go RAM (meilleure qualité)
docker compose exec ollama ollama pull mistral:7b
```

L'interface est disponible sur **http://localhost:3000**

## Installation sans Docker

### Prérequis

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installé et actif localement

### Backend

```bash
cp .env.example .env   # configurer OLLAMA_HOST, REDDIT_CLIENT_ID, etc.

python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r backend/requirements.txt

uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration (`.env`)

```env
# Ollama
OLLAMA_HOST=http://localhost:11434   # http://ollama:11434 avec Docker
OLLAMA_MODEL=llama3.2:3b

# Collecte
COLLECT_INTERVAL_HOURS=1
DATA_RETENTION_DAYS=90

# Reddit — optionnel, améliore les limites de taux
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=trendboard/1.0

# Dev.to — optionnel
DEVTO_API_KEY=

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

## Architecture

```
backend/
├── main.py              # Point d'entrée FastAPI, lifespan
├── scheduler.py         # Collecte planifiée (APScheduler)
├── database.py          # SQLAlchemy + SQLite
├── models.py            # ORM : Item, Analysis, Favorite, UserSetting
├── schemas.py           # Schémas Pydantic
├── collectors/
│   ├── github_trending.py   # Scraping HTML (daily/weekly/monthly)
│   ├── hacker_news.py       # API Firebase JSON
│   ├── reddit.py            # API Reddit (OAuth + fallback public)
│   ├── devto.py             # API REST Dev.to
│   └── huggingface.py       # API HuggingFace (modèles + Spaces)
├── ai/
│   └── analyzer.py      # Interface Ollama : analyse item + synthèse période
└── routers/
    ├── trends.py        # GET /api/trends, GET /api/trends/{id}/analysis
    ├── analysis.py      # GET /api/summary
    ├── favorites.py     # CRUD /api/favorites
    └── settings.py      # GET/PUT /api/settings (centres d'intérêt)

frontend/
└── src/
    ├── components/
    │   ├── ui/          # Avatar, Tooltip (Radix UI)
    │   ├── Sidebar.jsx      # Navigation + filtre par source
    │   ├── TrendItem.jsx    # Carte horizontale avec avatar/logo
    │   ├── AISummary.jsx    # Synthèse IA (filtrée par source)
    │   ├── TimeSelector.jsx
    │   └── SourceBadge.jsx
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── Favorites.jsx
    │   └── Settings.jsx     # Configuration des centres d'intérêt
    ├── lib/utils.js          # getAvatarUrl, formatScore, timeAgo…
    └── api.js               # Client Axios
```

## API

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trends` | Tendances (`period`, `source`, `language`, `search`, `limit`) |
| `GET` | `/api/trends/{id}/analysis` | Analyse IA d'un item — déclenche Ollama si absente |
| `GET` | `/api/summary` | Synthèse IA de la période (`period`, `source` optionnel) |
| `GET` | `/api/favorites` | Liste des favoris |
| `POST` | `/api/favorites` | Ajouter un favori |
| `DELETE` | `/api/favorites/{id}` | Supprimer un favori |
| `GET` | `/api/settings` | Centres d'intérêt de l'utilisateur |
| `PUT` | `/api/settings` | Mettre à jour les centres d'intérêt |
| `POST` | `/api/refresh` | Déclencher une collecte manuelle |
| `GET` | `/api/stats` | Statistiques globales (nb items par source, dernière collecte) |

## Modèle de données

| Table | Description |
|---|---|
| `items` | Contenus collectés — `url + trending_since` unique |
| `analyses` | Analyses Ollama par item (lazy, à la demande) |
| `favorites` | Items mis en favoris avec note optionnelle |
| `user_settings` | Préférences utilisateur (sources, sujets, langages) |

## Points d'attention

- **GitHub Trending** : scraping HTML fragile — en cas de changement de structure, seul `github_trending.py` est à mettre à jour
- **Ollama** : l'analyse IA est synchrone et bloquante ; préférez `llama3.2:3b` sur CPU pour la rapidité
- **Reddit** : sans `REDDIT_CLIENT_ID`, l'API publique est utilisée avec des limites de taux plus strictes
- **HuggingFace** : l'API ne supporte pas `sort=trending`, le tri se fait par `likes`
