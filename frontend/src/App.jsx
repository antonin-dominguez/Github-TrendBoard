import { useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/Tooltip";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import { fetchStats, triggerRefresh } from "./api";
import { useEffect } from "react";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [source, setSource] = useState("");
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerRefresh();
      const s = await fetchStats();
      setStats(s);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <TooltipProvider>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { background: "#141820", border: "1px solid rgba(255,255,255,0.07)", color: "#CBD5E1" },
        }}
      />

      <div className="min-h-screen bg-bg-base">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-bg-base/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-glow">
              T
            </div>
            <span className="text-sm font-semibold text-slate-200 tracking-tight">TrendBoard</span>
          </div>
          <div className="flex-1" />
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-600">
              <span><span className="text-slate-400 font-medium">{stats.total_items.toLocaleString()}</span> items</span>
              {Object.entries(stats.sources || {}).map(([src, count]) => count > 0 && (
                <span key={src}>{src}: <span className="text-slate-400">{count}</span></span>
              ))}
            </div>
          )}
        </header>

        {/* Layout */}
        <div className="flex max-w-6xl mx-auto px-4 gap-6">
          <Sidebar
            page={page}
            setPage={setPage}
            source={source}
            setSource={setSource}
            stats={stats}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          <main className="flex-1 min-w-0 py-6">
            {page === "dashboard" && <Dashboard source={source} />}
            {page === "favorites" && <Favorites />}
            {page === "settings" && <Settings />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
