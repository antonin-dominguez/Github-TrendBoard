import { useState, useEffect, useRef } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSummary } from "../api";

const SOURCE_LABELS = {
  github:      "GitHub Trending",
  hackernews:  "Hacker News",
  reddit:      "Reddit",
  devto:       "Dev.to",
  huggingface: "HuggingFace",
};

export default function AISummary({ period, source }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  // Reset summary when period or source changes
  const prevKey = useRef(null);
  const key = `${period}:${source || "all"}`;
  if (prevKey.current !== key) {
    prevKey.current = key;
    if (summary) setSummary(null);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSummary(period, source || undefined);
      setSummary(data);
      setOpen(true);
    } catch {
      toast.error("Ollama inaccessible");
    } finally {
      setLoading(false);
    }
  }

  const sourceLabel = source ? SOURCE_LABELS[source] ?? source : "toutes les sources";

  return (
    <div className="surface mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-slate-300">Synthèse IA</span>
          <span className="text-[11px] text-slate-600">
            {sourceLabel}
            {summary ? ` · ${summary.item_count} items` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            disabled={loading}
            className="btn-sm bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 disabled:opacity-40 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Génération..." : summary ? "Régénérer" : "Générer"}
          </button>
          {summary && (
            <button onClick={() => setOpen((v) => !v)} className="btn-ghost-sm text-slate-600">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {open && summary && (
        <div className="px-4 pb-4 pt-0 border-t border-border animate-slide-down">
          <p className="text-sm text-slate-300 leading-relaxed pt-3">{summary.summary}</p>
        </div>
      )}

      {!summary && !loading && (
        <div className="px-4 pb-3 border-t border-border">
          <p className="text-xs text-slate-600 pt-3 italic">
            Générez un résumé IA des tendances {source ? `de ${sourceLabel}` : "de toutes les sources"} pour cette période.
          </p>
        </div>
      )}
    </div>
  );
}
