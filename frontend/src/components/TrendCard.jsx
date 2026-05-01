import { useState } from "react";
import { fetchAnalysis, addFavorite, removeFavorite } from "../api";
import SourceBadge from "./SourceBadge";

function StarIcon({ filled }) {
  return (
    <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function ScoreBadge({ score, source }) {
  const fmt = score >= 1000 ? `${(score / 1000).toFixed(1)}k` : score.toLocaleString();
  const label = source === "reddit" ? "↑" : source === "devto" ? "♥" : "★";
  if (score >= 5000) return <span className="text-orange-400 font-semibold text-xs">🔥 {fmt}</span>;
  if (score >= 1000) return <span className="text-yellow-400 font-semibold text-xs">{label} {fmt}</span>;
  return <span className="text-slate-500 text-xs font-medium">{label} {fmt}</span>;
}

const LANG_COLORS = {
  Python: "bg-blue-400", JavaScript: "bg-yellow-400", TypeScript: "bg-blue-500",
  Go: "bg-cyan-400", Rust: "bg-orange-500", Java: "bg-red-400", "C++": "bg-pink-400",
  C: "bg-slate-400", Ruby: "bg-red-500", Swift: "bg-orange-400", Kotlin: "bg-violet-400",
  Shell: "bg-green-400", Zig: "bg-yellow-500", Lua: "bg-blue-300",
};

export default function TrendCard({ item, favoriteId, onFavoriteToggle }) {
  const [analysis, setAnalysis] = useState(item.analysis || null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isFav = favoriteId != null;

  // Display title: strip owner prefix for GitHub repos
  const isGithub = item.source === "github";
  const isHF = item.source === "huggingface";
  const displayName = isGithub && item.title.includes("/")
    ? item.title.split("/")[1]
    : item.title.replace(/^\[Space\] /, "");
  const displayOwner = isGithub && item.title.includes("/")
    ? item.title.split("/")[0]
    : isHF && item.author
    ? item.author
    : null;

  async function handleAnalyze() {
    if (analysis) { setExpanded((v) => !v); return; }
    setLoadingAI(true);
    try {
      const data = await fetchAnalysis(item.id);
      setAnalysis(data);
      setExpanded(true);
    } catch {
      alert("Ollama n'est pas disponible.");
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleFav() {
    if (isFav) {
      await removeFavorite(favoriteId);
      onFavoriteToggle(item.id, null);
    } else {
      const fav = await addFavorite(item.id, null);
      onFavoriteToggle(item.id, fav.id);
    }
  }

  function handleExport() {
    const keywords = (() => {
      try { return JSON.parse(analysis?.keywords || "[]").join(", "); } catch { return ""; }
    })();
    const lines = [
      `## [${item.title}](${item.url})`,
      `> ${item.source} · ${item.score >= 1000 ? `${(item.score / 1000).toFixed(1)}k` : item.score} pts${item.language ? ` · ${item.language}` : ""}`,
      analysis?.summary ? `\n${analysis.summary}` : "",
      analysis?.why_it_matters ? `\n**Impact :** ${analysis.why_it_matters}` : "",
      keywords ? `\n**Mots-clés :** ${keywords}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
  }

  const tags = (() => { try { return JSON.parse(item.tags || "[]").filter(Boolean); } catch { return []; } })();
  const langColor = LANG_COLORS[item.language] || "bg-slate-500";

  const isHFSpace = item.source === "huggingface" && item.title.startsWith("[Space]");

  return (
    <div className="group card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source={item.source} />
            {isHFSpace && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Space</span>
            )}
            {analysis?.category && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
                {analysis.category}
              </span>
            )}
          </div>
          {displayOwner && (
            <span className="text-[11px] text-slate-600 truncate leading-none">{displayOwner} /</span>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-slate-100 hover:text-cyan-400 transition-colors leading-snug line-clamp-2"
          >
            {displayName}
          </a>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleFav} className={`p-1.5 rounded-lg transition-colors ${isFav ? "text-yellow-400 hover:text-yellow-300" : "text-slate-600 hover:text-slate-400"}`}>
            <StarIcon filled={isFav} />
          </button>
          <button onClick={handleExport} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors" title="Copier en Markdown">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <ScoreBadge score={item.score} source={item.source} />
        {item.comments_count > 0 && (
          <span className="text-xs text-slate-500">💬 {item.comments_count.toLocaleString()}</span>
        )}
        {item.language && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${langColor}`} />
            {item.language}
          </span>
        )}
        {tags.length > 0 && !item.language && (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">{t}</span>
            ))}
          </div>
        )}
        {analysis?.relevance_score && (
          <span className="text-[11px] text-slate-500 ml-auto">
            Pertinence <span className="text-cyan-400 font-semibold">{analysis.relevance_score}/10</span>
          </span>
        )}
      </div>

      {/* AI section */}
      <div className="border-t border-white/[0.05] pt-3 mt-auto">
        {!expanded && (
          <button
            onClick={handleAnalyze}
            disabled={loadingAI}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-cyan-400 disabled:text-slate-700 transition-colors"
          >
            {loadingAI ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyse en cours...
              </>
            ) : (
              <>
                <span className="text-[11px]">✦</span>
                {analysis ? "Voir l'analyse IA" : "Analyser avec IA"}
              </>
            )}
          </button>
        )}

        {expanded && analysis && (
          <div className="flex flex-col gap-3">
            {analysis.summary && (
              <p className="text-sm text-slate-400 leading-relaxed">{analysis.summary}</p>
            )}
            {analysis.why_it_matters && (
              <p className="text-xs text-slate-500 italic border-l-2 border-cyan-500/30 pl-3">{analysis.why_it_matters}</p>
            )}
            {(() => {
              try {
                const kws = JSON.parse(analysis.keywords || "[]");
                return kws.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {kws.map((k) => (
                      <span key={k} className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-500">{k}</span>
                    ))}
                  </div>
                ) : null;
              } catch { return null; }
            })()}
            <button onClick={() => setExpanded(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors self-start">
              Réduire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
