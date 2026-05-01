import { useState } from "react";

const LANGUAGES = ["", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C", "Ruby", "Swift", "Kotlin"];

export default function FilterBar({ filters, onChange }) {
  const [search, setSearch] = useState(filters.search || "");

  function handleSearch(e) {
    const v = e.target.value;
    setSearch(v);
    if (v.length === 0 || v.length >= 2) onChange({ ...filters, search: v });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un repo..."
          value={search}
          onChange={handleSearch}
          className="pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-slate-300 placeholder-slate-600 rounded-xl w-56 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
        />
      </div>

      <select
        value={filters.language || ""}
        onChange={(e) => onChange({ ...filters, language: e.target.value })}
        className="py-2 px-3 text-sm bg-white/[0.04] border border-white/[0.08] text-slate-400 rounded-xl focus:outline-none focus:border-cyan-500/40 transition-all appearance-none cursor-pointer"
      >
        <option value="">Tous les langages</option>
        {LANGUAGES.slice(1).map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </div>
  );
}
