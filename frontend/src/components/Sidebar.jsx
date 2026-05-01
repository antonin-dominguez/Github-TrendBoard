import { LayoutDashboard, Star, Sparkles, Github, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";

const SOURCES = [
  { id: "",            label: "Toutes les sources" },
  { id: "github",      label: "GitHub" },
  { id: "hackernews",  label: "Hacker News" },
  { id: "reddit",      label: "Reddit" },
  { id: "devto",       label: "Dev.to" },
  { id: "huggingface", label: "HuggingFace" },
];

const SOURCE_DOTS = {
  github:      "bg-slate-400",
  hackernews:  "bg-amber-400",
  reddit:      "bg-rose-400",
  devto:       "bg-violet-400",
  huggingface: "bg-yellow-400",
};

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-indigo-600/15 text-indigo-400 font-medium"
          : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export default function Sidebar({ page, setPage, source, setSource, stats, onRefresh, refreshing }) {
  return (
    <aside className="w-52 shrink-0 flex flex-col gap-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pr-2">
      {/* Nav */}
      <div className="flex flex-col gap-0.5 mb-4">
        <NavItem icon={LayoutDashboard} label="Tendances"  active={page === "dashboard"} onClick={() => setPage("dashboard")} />
        <NavItem icon={Star}           label="Favoris"     active={page === "favorites"}  onClick={() => setPage("favorites")} />
        <NavItem icon={Sparkles}       label="Intérêts"    active={page === "settings"}   onClick={() => setPage("settings")} />
      </div>

      <div className="border-t border-border my-1" />

      {/* Sources */}
      <div className="mt-3">
        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Sources</p>
        <div className="flex flex-col gap-0.5">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSource(s.id); setPage("dashboard"); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150",
                source === s.id && page === "dashboard"
                  ? "bg-white/6 text-slate-200 font-medium"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
              )}
            >
              {s.id ? (
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", SOURCE_DOTS[s.id])} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
              )}
              <span className="truncate">{s.label}</span>
              {stats && s.id && (
                <span className="ml-auto text-[11px] text-slate-600 tabular-nums">
                  {stats.sources?.[s.id] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 hover:bg-white/4 transition-all disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Collecte..." : "Actualiser"}
        </button>
        {stats?.last_collection && (
          <p className="text-[10px] text-slate-700 px-3 mt-1">
            Dernière collecte {new Date(stats.last_collection + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </aside>
  );
}
