const SOURCE_CONFIG = {
  github: { label: "GitHub", className: "bg-slate-700/60 text-slate-300 border-slate-600/40" },
  hackernews: { label: "HN", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  reddit: { label: "Reddit", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  devto: { label: "Dev.to", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

export default function SourceBadge({ source }) {
  const config = SOURCE_CONFIG[source] ?? { label: source, className: "bg-slate-700/60 text-slate-400 border-slate-600/40" };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${config.className} tracking-wide`}>
      {config.label}
    </span>
  );
}
