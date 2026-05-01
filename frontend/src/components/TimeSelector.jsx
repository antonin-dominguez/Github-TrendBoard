const PERIODS = [
  { value: "day",   label: "Aujourd'hui" },
  { value: "week",  label: "Semaine" },
  { value: "month", label: "Mois" },
];

export default function TimeSelector({ value, onChange }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-lg bg-bg-muted border border-border">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
            value === p.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
