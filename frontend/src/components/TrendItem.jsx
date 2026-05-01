import { useState } from "react";
import { Star, Copy, Sparkles, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./ui/Avatar";
import { Tooltip } from "./ui/Tooltip";
import SourceBadge from "./SourceBadge";
import { fetchAnalysis, addFavorite, removeFavorite } from "../api";
import { getAvatarUrl, formatScore, timeAgo, parseTags, cn } from "../lib/utils";

const LANG_DOT = {
  Python: "#3B82F6", JavaScript: "#F59E0B", TypeScript: "#60A5FA",
  Go: "#22D3EE", Rust: "#F97316", Java: "#EF4444", "C++": "#EC4899",
  C: "#94A3B8", Ruby: "#EF4444", Swift: "#F97316", Kotlin: "#8B5CF6",
  Shell: "#10B981", Zig: "#FBBF24", Lua: "#93C5FD",
};

const SCORE_ICON = { reddit: "↑", devto: "♥" };

function ScoreDisplay({ score, source }) {
  const icon = SCORE_ICON[source] || "★";
  const color = score >= 5000 ? "text-orange-400" : score >= 1000 ? "text-amber-400" : "text-slate-500";
  return (
    <span className={cn("text-xs font-medium tabular-nums whitespace-nowrap", color)}>
      {score >= 5000 && "🔥 "}
      {icon} {formatScore(score)}
    </span>
  );
}

export default function TrendItem({ item, favoriteId, onFavoriteToggle }) {
  const [analysis, setAnalysis] = useState(item.analysis || null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isFav = favoriteId != null;
  const avatarUrl = getAvatarUrl(item);

  const isGH = item.source === "github";
  const isHF = item.source === "huggingface";
  const isSpace = isHF && item.title.startsWith("[Space] ");

  const displayName = isGH && item.title.includes("/")
    ? item.title.split("/")[1]
    : item.title.replace(/^\[Space\] /, "");

  const displayOwner = isGH && item.title.includes("/")
    ? item.title.split("/")[0]
    : isHF && item.author ? item.author : null;

  const tags = parseTags(item.tags);
  const langColor = LANG_DOT[item.language];
  const ago = timeAgo(item.collected_at);

  async function handleAnalyze() {
    if (analysis) { setExpanded((v) => !v); return; }
    setLoadingAI(true);
    try {
      const data = await fetchAnalysis(item.id);
      setAnalysis(data);
      setExpanded(true);
    } catch {
      toast.error("Ollama n'est pas disponible");
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleFav() {
    try {
      if (isFav) {
        await removeFavorite(favoriteId);
        onFavoriteToggle(item.id, null);
        toast.success("Retiré des favoris");
      } else {
        const fav = await addFavorite(item.id, null);
        onFavoriteToggle(item.id, fav.id);
        toast.success("Ajouté aux favoris");
      }
    } catch {
      toast.error("Erreur");
    }
  }

  function handleCopy() {
    const kws = parseTags(analysis?.keywords);
    const md = [
      `## [${item.title}](${item.url})`,
      `> ${item.source} · ${formatScore(item.score)}${item.language ? ` · ${item.language}` : ""}`,
      analysis?.summary ? `\n${analysis.summary}` : "",
      analysis?.why_it_matters ? `\n**Impact :** ${analysis.why_it_matters}` : "",
      kws.length ? `\n**Mots-clés :** ${kws.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(md);
    toast.success("Copié en Markdown !");
  }

  return (
    <div className={cn(
      "group relative surface surface-hover px-4 py-3.5 flex gap-3.5 animate-fade-in",
      expanded && "border-border-strong"
    )}>
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <Avatar
            src={avatarUrl}
            fallback={displayOwner || displayName}
            size="md"
            className="ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all"
          />
        </a>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: badges + title + score + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <SourceBadge source={item.source} />
              {isSpace && <span className="badge badge-amber">Space</span>}
              {analysis?.category && (
                <span className="badge-indigo">{analysis.category}</span>
              )}
              {item.language && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langColor || "#64748b" }} />
                  {item.language}
                </span>
              )}
              {!item.language && tags.slice(0, 2).map((t) => (
                <span key={t} className="badge-default">{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {displayOwner && (
                <span className="text-xs text-slate-600 shrink-0">{displayOwner}/</span>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-slate-100 hover:text-indigo-400 transition-colors truncate flex items-center gap-1"
              >
                {displayName}
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 shrink-0 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Right: score + actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ScoreDisplay score={item.score} source={item.source} />
            {item.comments_count > 0 && (
              <Tooltip content="Commentaires">
                <span className="flex items-center gap-0.5 text-xs text-slate-600 ml-1">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {formatScore(item.comments_count)}
                </span>
              </Tooltip>
            )}
            <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <button onClick={handleFav} className={cn("btn-ghost-sm rounded-md", isFav && "!text-amber-400")}>
                  <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
                </button>
              </Tooltip>
              <Tooltip content="Copier en Markdown">
                <button onClick={handleCopy} className="btn-ghost-sm rounded-md">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Row 2: AI trigger / expanded analysis */}
        <div className="mt-2.5">
          {!expanded ? (
            <button
              onClick={handleAnalyze}
              disabled={loadingAI}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                analysis
                  ? "text-indigo-400 hover:text-indigo-300"
                  : "text-slate-600 hover:text-slate-400",
                loadingAI && "text-slate-700 cursor-wait"
              )}
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
                  <Sparkles className="w-3 h-3" />
                  {analysis ? "Voir l'analyse IA" : "Analyser avec IA"}
                  {analysis && <ChevronDown className="w-3 h-3" />}
                </>
              )}
            </button>
          ) : (
            <div className="animate-slide-down border-t border-border mt-2 pt-3 flex flex-col gap-2.5">
              {analysis.summary && (
                <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
              )}
              {analysis.why_it_matters && (
                <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-indigo-500/40">
                  {analysis.why_it_matters}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {parseTags(analysis.keywords).map((k) => (
                  <span key={k} className="badge-default">{k}</span>
                ))}
                {analysis.relevance_score && (
                  <span className="text-xs text-slate-500 ml-auto">
                    Pertinence&nbsp;<span className="text-indigo-400 font-semibold">{analysis.relevance_score}/10</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors self-start mt-0.5"
              >
                <ChevronUp className="w-3 h-3" /> Réduire
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
