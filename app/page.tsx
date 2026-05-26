"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import CaseStudyForm from "./components/CaseStudyForm";
import HistoryPage from "./components/HistoryPage";
import AboutPage from "./components/AboutPage";
import type { NavItem, HistoryItem } from "./types";

const STORAGE_KEY = "case-study-history";

export default function Home() {
  const [nav, setNav] = useState<NavItem>("generate");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  const handleGenerated = (projectName: string, content: string) => {
    const preview =
      content
        .split("\n")
        .find((l) => l.trim() && !l.startsWith("#"))
        ?.trim()
        .slice(0, 120) ?? "";

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      projectName,
      generatedAt: new Date().toISOString(),
      content,
      preview,
    };

    setHistory((prev) => [item, ...prev]);
  };

  const handleDelete = (id: string) =>
    setHistory((prev) => prev.filter((item) => item.id !== id));

  const navLabel: Record<NavItem, string> = {
    generate: "Generate",
    history: "History",
    about: "About",
  };

  return (
    <div className="flex h-screen bg-[#0c0c10] overflow-hidden">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 40% at 20% -10%, rgba(245,158,11,0.07) 0%, transparent 70%)`,
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        nav={nav}
        onNavChange={(n) => {
          setNav(n);
          setSidebarOpen(false);
        }}
        historyCount={history.length}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0 bg-[#0c0c10]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium">
            {navLabel[nav]}
          </span>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {nav === "generate" && (
              <CaseStudyForm onGenerated={handleGenerated} />
            )}
            {nav === "history" && (
              <HistoryPage items={history} onDelete={handleDelete} />
            )}
            {nav === "about" && <AboutPage />}
          </div>

          {/* Footer */}
          <div className="max-w-3xl mx-auto px-6 pb-10 text-center space-y-1.5">
            <p className="text-gray-700 text-xs">
              Built by Abayomi Omotoso · Product Designer · Birmingham, UK · 2026
            </p>
            <p className="text-gray-600 text-xs">
              A free tool to help designers turn project notes into compelling
              portfolio case studies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
