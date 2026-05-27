// ─────────────────────────────────────────────────────────────────────────────
// app/page.tsx — Root page of the app
//
// This is the top-level layout component. It:
//   • Renders the sidebar navigation and the main content area side by side
//   • Tracks which nav item is active (Generate / History / About)
//   • Manages the full history of generated case studies in state
//   • Persists history to localStorage so it survives page refreshes
//   • Passes callbacks down so child components can save or delete history items
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import CaseStudyForm from "./components/CaseStudyForm";
import HistoryPage from "./components/HistoryPage";
import AboutPage from "./components/AboutPage";
import type { NavItem, HistoryItem } from "./types";

// Key used to store and retrieve history from the browser's localStorage
const STORAGE_KEY = "case-study-history";

export default function Home() {
  // Tracks which section the user is currently viewing
  const [nav, setNav] = useState<NavItem>("generate");

  // Stores all previously generated case studies for the History page
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Controls whether the sidebar is open on mobile (slide-in drawer)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Controls whether the sidebar is collapsed (icons only) or expanded (icons + labels)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── On first load, read saved history from localStorage ──────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // Silently ignore if the stored data is corrupt or unreadable
    }
  }, []);

  // ── Whenever history changes, save the updated list to localStorage ───────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Silently ignore storage errors (e.g. private browsing with full storage)
    }
  }, [history]);

  // ── Called by CaseStudyForm when a generation completes ──────────────────
  // Builds a HistoryItem and prepends it to the history list
  const handleGenerated = (projectName: string, content: string) => {
    // Extract the first non-heading line as a short preview snippet
    const preview =
      content
        .split("\n")
        .find((l) => l.trim() && !l.startsWith("#"))
        ?.trim()
        .slice(0, 120) ?? "";

    const item: HistoryItem = {
      id: crypto.randomUUID(),       // Unique ID for this entry
      projectName,
      generatedAt: new Date().toISOString(), // Timestamp of generation
      content,                        // Full markdown output from the AI
      preview,                        // Short excerpt shown in the History list
    };

    // Add the new item to the top of the history list
    setHistory((prev) => [item, ...prev]);
  };

  // ── Removes a single history entry by its ID ─────────────────────────────
  const handleDelete = (id: string) =>
    setHistory((prev) => prev.filter((item) => item.id !== id));

  // Maps each nav key to a human-readable label for the mobile top bar
  const navLabel: Record<NavItem, string> = {
    generate: "Generate",
    history: "History",
    about: "About",
  };

  return (
    // Full-screen flex layout: sidebar on the left, main content fills the rest
    <div className="flex h-screen bg-[#0c0c10] overflow-hidden">

      {/* Decorative background glow — purely visual, no interaction */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 40% at 20% -10%, rgba(245,158,11,0.07) 0%, transparent 70%)`,
        }}
      />

      {/* Dark overlay shown behind the sidebar on mobile when it's open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} // Tap overlay to close sidebar
        />
      )}

      {/* Sidebar — handles navigation between the three sections */}
      <Sidebar
        nav={nav}
        onNavChange={(n) => {
          setNav(n);
          setSidebarOpen(false); // Auto-close the mobile drawer when a link is tapped
        }}
        historyCount={history.length}       // Shows the count badge on the History nav item
        open={sidebarOpen}                  // Whether the mobile drawer is visible
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}        // Whether the desktop sidebar is in icon-only mode
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main content area — fills all space to the right of the sidebar */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Mobile-only top bar with hamburger menu and current page title */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0 bg-[#0c0c10]">
          <button
            onClick={() => setSidebarOpen(true)} // Opens the sidebar drawer on mobile
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Shows the name of the active section */}
          <span className="text-white text-sm font-medium">
            {navLabel[nav]}
          </span>
        </div>

        {/* Scrollable content area — only this part scrolls, not the whole page */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12">

            {/* Render the correct page based on which nav item is active */}
            {nav === "generate" && (
              <CaseStudyForm onGenerated={handleGenerated} />
            )}
            {nav === "history" && (
              <HistoryPage items={history} onDelete={handleDelete} />
            )}
            {nav === "about" && <AboutPage />}
          </div>

          {/* Footer — shown below the page content on all three sections */}
          <div className="max-w-3xl mx-auto px-6 pb-10 text-center space-y-1.5">
            <p className="text-gray-700 text-xs">
              Built by Abayomi Omotoso · Product Designer · United Kingdom · 2026
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
