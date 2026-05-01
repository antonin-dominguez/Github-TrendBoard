const SOURCE_CONFIG = {
  github:      { label: "GitHub",       cls: "badge-default" },
  hackernews:  { label: "HN",           cls: "badge-amber" },
  reddit:      { label: "Reddit",       cls: "badge-rose" },
  devto:       { label: "Dev.to",       cls: "badge-violet" },
  huggingface: { label: "HuggingFace", cls: "badge-amber" },
};

export default function SourceBadge({ source }) {
  const { label, cls } = SOURCE_CONFIG[source] ?? { label: source, cls: "badge-default" };
  return <span className={cls}>{label}</span>;
}
