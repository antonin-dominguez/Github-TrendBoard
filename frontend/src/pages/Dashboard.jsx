import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { fetchTrends, fetchFavorites } from "../api";
import TimeSelector from "../components/TimeSelector";
import TrendItem from "../components/TrendItem";
import AISummary from "../components/AISummary";

const LANGUAGES = ["", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C", "Ruby", "Swift", "Kotlin", "Shell", "Zig"];

function Skeleton() {
  return (
    <div className="surface px-4 py-3.5 flex gap-3.5 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-bg-overlay shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="flex gap-2">
          <div className="h-4 w-12 rounded bg-bg-overlay" />
          <div className="h-4 w-24 rounded bg-bg-overlay" />
        </div>
        <div className="h-4 w-48 rounded bg-bg-overlay" />
        <div className="h-3 w-20 rounded bg-bg-overlay" />
      </div>
    </div>
  );
}

export default function Dashboard({ source }) {
  const [period, setPeriod] = useState("day");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period, limit: 60 };
      if (source)   params.source = source;
      if (language) params.language = language;
      if (search && search.length >= 2) params.search = search;

      const [trends, favData] = await Promise.all([
        fetchTrends(params),
        fetchFavorites(),
      ]);
      setItems(trends);
      const favMap = {};
      favData.forEach((f) => { favMap[f.item_id] = f.id; });
      setFavorites(favMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [period, source, language, search]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleFavoriteToggle(itemId, favId) {
    setFavorites((prev) => {
      const next = { ...prev };
      if (favId == null) delete next[itemId];
      else next[itemId] = favId;
      return next;
    });
  }

  const PERIOD_LABELS = { day: "Aujourd'hui", week: "Cette semaine", month: "Ce mois" };

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-lg">
            {source ? source.charAt(0).toUpperCase() + source.slice(1) : "Tendances"}
          </h1>
          <p className="text-micro mt-0.5">{PERIOD_LABELS[period]} · {items.length} résultats</p>
        </div>
        <div className="flex items-center gap-2">
          <TimeSelector value={period} onChange={setPeriod} />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn-ghost-sm border border-border rounded-lg ${showFilters ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/5" : ""}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-subtle border border-border text-slate-300 placeholder-slate-600 rounded-xl focus:outline-none focus:border-indigo-500/40 transition-all"
          />
        </div>

        {showFilters && (
          <div className="flex gap-2 animate-slide-down">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="py-1.5 px-3 text-sm bg-bg-subtle border border-border text-slate-400 rounded-lg focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer"
            >
              <option value="">Tous les langages</option>
              {LANGUAGES.slice(1).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <AISummary period={period} source={source || undefined} />

      {/* Feed */}
      <div className="flex flex-col gap-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
          : items.length === 0
          ? (
            <div className="surface flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-overlay flex items-center justify-center text-2xl">📭</div>
              <p className="text-slate-400 font-medium text-sm">Aucune tendance trouvée</p>
              <p className="text-micro">Modifiez les filtres ou actualisez les données.</p>
            </div>
          )
          : items.map((item) => (
            <TrendItem
              key={item.id}
              item={item}
              favoriteId={favorites[item.id] ?? null}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))
        }
      </div>
    </div>
  );
}
