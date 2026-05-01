const PERIODS = [
  { value: "day", label: "24h" },
  { value: "week", label: "7 jours" },
  { value: "month", label: "30 jours" },
];

export default function TimeSelector({ value, onChange }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-5 py-2 rounded-[10px] text-sm font-medium transition-all duration-200 ${
            value === p.value
              ? "bg-gradient-to-r from-cyan-600/80 to-violet-600/80 text-white shadow-lg shadow-cyan-900/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
