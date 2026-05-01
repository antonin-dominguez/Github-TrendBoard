import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../api";

const ALL_TOPICS = ["IA/ML", "DevOps", "Web", "Sécurité", "Open Source", "Mobile", "Cloud", "Data", "Outillage"];
const ALL_LANGUAGES = ["Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C", "Ruby", "Swift", "Kotlin", "Shell", "Zig", "Lua"];
const ALL_SOURCES = [
  { id: "github", label: "GitHub Trending" },
  { id: "hackernews", label: "Hacker News" },
  { id: "reddit", label: "Reddit" },
  { id: "devto", label: "Dev.to" },
  { id: "huggingface", label: "HuggingFace" },
];

function ToggleChip({ label, active, onClick, color = "cyan" }) {
  const colors = {
    cyan: active ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300",
    violet: active ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300",
    emerald: active ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${colors[color]}`}
    >
      {active && <span className="mr-1.5 text-[10px]">✓</span>}
      {label}
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-200">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [interests, setInterests] = useState({ topics: [], languages: [], sources: ALL_SOURCES.map((s) => s.id) });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then((data) => {
      setInterests(data.interests);
      setLoading(false);
    });
  }, []);

  function toggle(field, value) {
    setInterests((prev) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(interests);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-600">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight gradient-text">Centres d'intérêt</h1>
        <p className="text-xs text-slate-500 mt-1">
          Les tendances sont triées selon vos préférences. Sans sélection, tout s'affiche par popularité brute.
        </p>
      </div>

      <Section
        title="Sources"
        description="Choisissez les plateformes à surveiller."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_SOURCES.map((s) => (
            <ToggleChip
              key={s.id}
              label={s.label}
              active={(interests.sources || []).includes(s.id)}
              onClick={() => toggle("sources", s.id)}
              color="emerald"
            />
          ))}
        </div>
      </Section>

      <Section
        title="Sujets"
        description="Les contenus correspondant à ces thèmes remontent en priorité."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map((t) => (
            <ToggleChip
              key={t}
              label={t}
              active={(interests.topics || []).includes(t)}
              onClick={() => toggle("topics", t)}
              color="violet"
            />
          ))}
        </div>
      </Section>

      <Section
        title="Langages"
        description="Les projets dans ces langages sont mis en avant."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_LANGUAGES.map((l) => (
            <ToggleChip
              key={l}
              label={l}
              active={(interests.languages || []).includes(l)}
              onClick={() => toggle("languages", l)}
              color="cyan"
            />
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer les préférences"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400 flex items-center gap-1.5">
            <span>✓</span> Sauvegardé — la prochaine collecte utilisera ces préférences.
          </span>
        )}
      </div>
    </div>
  );
}
