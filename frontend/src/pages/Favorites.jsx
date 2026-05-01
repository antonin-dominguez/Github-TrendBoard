import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { fetchFavorites } from "../api";
import TrendItem from "../components/TrendItem";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites().then((data) => { setFavorites(data); setLoading(false); });
  }, []);

  function handleFavoriteToggle(itemId, favId) {
    if (favId == null) setFavorites((prev) => prev.filter((f) => f.item_id !== itemId));
  }

  const favMap = Object.fromEntries(favorites.map((f) => [f.item_id, f.id]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading text-lg">Favoris</h1>
        <p className="text-micro mt-0.5">{favorites.length} repo{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col gap-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface h-20 animate-pulse" />
            ))
          : favorites.length === 0
          ? (
            <div className="surface flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-overlay flex items-center justify-center">
                <Star className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium text-sm">Aucun favori</p>
              <p className="text-micro">Marquez des items avec l'étoile pour les retrouver ici.</p>
            </div>
          )
          : favorites.map((fav) => (
            <TrendItem
              key={fav.id}
              item={fav.item}
              favoriteId={fav.id}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))
        }
      </div>
    </div>
  );
}
