import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#080b14]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-cyan-900/40">
              T
            </div>
            <span className="font-semibold tracking-tight text-slate-100">TrendBoard</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-wider uppercase">GitHub</span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage("dashboard")}
              className={`btn-ghost flex items-center gap-1.5 ${page === "dashboard" ? "text-slate-200 bg-white/[0.06]" : ""}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Tendances
            </button>
            <button
              onClick={() => setPage("favorites")}
              className={`btn-ghost flex items-center gap-1.5 ${page === "favorites" ? "text-slate-200 bg-white/[0.06]" : ""}`}
            >
              <svg className="w-3.5 h-3.5" fill={page === "favorites" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Favoris
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {page === "dashboard" && <Dashboard />}
        {page === "favorites" && <Favorites />}
      </main>
    </div>
  );
}
