import { useState, useEffect } from "react";
import { fetchFavorites } from "../api";
import TrendCard from "../components/TrendCard";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleFavoriteToggle(itemId, favId) {
    if (favId == null) {
      setFavorites((prev) => prev.filter((f) => f.item_id !== itemId));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">Favoris</h1>
          <p className="text-xs text-slate-600 mt-0.5">{favorites.length} repo{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] h-44 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl">
            ★
          </div>
          <p className="text-slate-400 font-medium">Aucun favori</p>
          <p className="text-slate-600 text-sm">Marquez des repos avec l'étoile pour les retrouver ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <TrendCard
              key={fav.id}
              item={fav.item}
              favoriteId={fav.id}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
