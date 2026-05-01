import { useState } from "react";
import { fetchSummary } from "../api";

export default function AISummary({ period }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSummary(period);
      setSummary(data);
    } catch {
      setError("Ollama inaccessible — assurez-vous qu'il est démarré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-950/40 via-[#080b14] to-violet-950/30 p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-violet-600/5 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-sm">✦</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Synthèse IA</p>
              {summary && (
                <p className="text-[11px] text-slate-500">{summary.item_count} repos analysés</p>
              )}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs py-1.5"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Génération...
              </span>
            ) : summary ? "Régénérer" : "Générer la synthèse"}
          </button>
        </div>

        {error && (
          <p className="text-red-400/80 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}
        {!summary && !error && !loading && (
          <p className="text-slate-600 text-sm italic">Générez un résumé IA de toutes les tendances de la période.</p>
        )}
        {summary && !loading && (
          <p className="text-slate-300 text-sm leading-relaxed">{summary.summary}</p>
        )}
      </div>
    </div>
  );
}
