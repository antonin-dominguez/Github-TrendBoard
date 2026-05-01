import { useState, useEffect, useCallback } from "react";
import { fetchTrends, fetchStats, triggerRefresh, fetchFavorites } from "../api";
import TimeSelector from "../components/TimeSelector";
import FilterBar from "../components/FilterBar";
import TrendCard from "../components/TrendCard";
import AISummary from "../components/AISummary";

function StatPill({ label, value, accent }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className={`text-xs font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("day");
  const [filters, setFilters] = useState({});
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trends, statsData, favData] = await Promise.all([
        fetchTrends({ period, ...filters, limit: 50 }),
        fetchStats(),
        fetchFavorites(),
      ]);
      setItems(trends);
      setStats(statsData);
      const favMap = {};
      favData.forEach((f) => { favMap[f.item_id] = f.id; });
      setFavorites(favMap);
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
  }, [period, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  function handleFavoriteToggle(itemId, favId) {
    setFavorites((prev) => {
      const next = { ...prev };
      if (favId == null) delete next[itemId];
      else next[itemId] = favId;
      return next;
    });
  }

  const lastCollect = stats?.last_collection
    ? new Date(stats.last_collection + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight gradient-text">Tendances GitHub</h1>
          {lastCollect && (
            <p className="text-xs text-slate-600">Dernière collecte à {lastCollect}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex gap-2">
              <StatPill label="repos" value={stats.total_items} accent="text-cyan-400" />
              <StatPill label="aujourd'hui" value={stats.items_today} accent="text-violet-400" />
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-1.5 disabled:opacity-40"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {refreshing ? "Collecte..." : "Actualiser"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimeSelector value={period} onChange={setPeriod} />
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* AI Summary */}
      <AISummary period={period} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] h-44 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl">
            📭
          </div>
          <p className="text-slate-400 font-medium">Aucune tendance trouvée</p>
          <p className="text-slate-600 text-sm">Modifiez les filtres ou cliquez sur Actualiser.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-600">{items.length} résultat{items.length > 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <TrendCard
                key={item.id}
                item={item}
                favoriteId={favorites[item.id] ?? null}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
