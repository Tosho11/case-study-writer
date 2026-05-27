// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.tsx — Left-hand navigation sidebar
//
// This component has three distinct behaviours:
//   1. DESKTOP EXPANDED — full width (w-56), shows "Casely" wordmark, nav labels,
//      history count badge, and the identity block at the bottom.
//   2. DESKTOP COLLAPSED — icon-only width (w-16), shows just the icons and the
//      AO avatar at the bottom. Hovering a nav item shows a tooltip via `title`.
//   3. MOBILE — fixed-position drawer that slides in from the left. Hidden by
//      default (translate-x-full), visible when `open` is true (translate-x-0).
//      A dark overlay behind it is rendered by page.tsx.
//
// The parent (page.tsx) owns all state — this component is purely presentational.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { Sparkles, Clock, Info, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { NavItem } from "../types";

// ── Props passed in from page.tsx ─────────────────────────────────────────────
interface Props {
  nav: NavItem;                        // Which nav item is currently active
  onNavChange: (nav: NavItem) => void; // Called when the user clicks a nav item
  historyCount: number;                // Number of saved history items (shown as a badge)
  open: boolean;                       // Whether the mobile drawer is visible
  onClose: () => void;                 // Called to close the mobile drawer
  collapsed: boolean;                  // Whether the desktop sidebar is in icon-only mode
  onToggleCollapse: () => void;        // Called to toggle the collapsed state
}

// ── Navigation item definitions ──────────────────────────────────────────────
// Defined outside the component so it's created once, not on every render.
const navItems: {
  id: NavItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "history",  label: "History",  icon: Clock     },
  { id: "about",    label: "About",    icon: Info      },
];

export default function Sidebar({
  nav,
  onNavChange,
  historyCount,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: Props) {
  return (
    // ── Outer <aside> — handles layout, positioning, and slide-in animation ──
    // - `fixed lg:static`: drawer on mobile, in-flow column on desktop
    // - Width transitions between w-56 (expanded) and w-16 (collapsed)
    // - Translate transition drives the mobile slide-in/out
    <aside
      className={[
        "fixed lg:static inset-y-0 left-0 z-30",
        "bg-[#0d0d12] border-r border-white/[0.06]",
        "flex flex-col flex-shrink-0",
        "transition-all duration-200 ease-in-out",
        collapsed ? "lg:w-16 w-56" : "w-56",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >

      {/* ── Header: app logo + collapse/close button ── */}
      {/* Fixed height (56px) keeps it aligned with the mobile top bar in page.tsx */}
      <div className="flex items-center border-b border-white/[0.06] h-[56px] px-3 gap-2">
        {collapsed ? (
          // COLLAPSED state: show a small Sparkles icon + ChevronRight to expand
          <>
            {/* Clicking the icon navigates to Generate (same as the wordmark) */}
            <button
              onClick={() => onNavChange("generate")}
              title="Generate"
              className="text-amber-400 hover:text-amber-300 transition-colors p-1"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {/* Desktop-only: expands the sidebar back to full width */}
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="ml-auto text-gray-500 hover:text-white transition-colors p-1 hidden lg:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          // EXPANDED state: show "Casely" wordmark + ChevronLeft (desktop) / X (mobile)
          <>
            {/* Clicking "Casely" always navigates back to the Generate section */}
            <button
              onClick={() => onNavChange("generate")}
              className="text-white font-bold text-lg tracking-tight hover:text-amber-400 transition-colors flex-1 text-left"
            >
              Casely
            </button>

            {/* Desktop: collapses the sidebar to icon-only mode */}
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden lg:flex text-gray-500 hover:text-white transition-colors p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile: closes the slide-in drawer */}
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation items ── */}
      {/* space-y-0 keeps items tightly packed; py-2 gives the section breathing room */}
      <nav className="flex-1 px-2 py-2 space-y-0">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = nav === id; // Whether this item is the current page

          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              // In collapsed mode, the `title` attribute provides a tooltip on hover
              title={collapsed ? label : undefined}
              className={[
                "w-full flex items-center rounded-lg text-sm font-medium transition-all border",
                // Collapsed: centre the icon; expanded: left-align with text
                collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5",
                // Active item gets amber highlight; inactive items fade in on hover
                active
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04] border-transparent",
              ].join(" ")}
            >
              {/* Icon — always shown, whether collapsed or expanded */}
              <Icon className="w-[15px] h-[15px] flex-shrink-0" />

              {/* Label — hidden in collapsed mode */}
              {!collapsed && <span>{label}</span>}

              {/* History count badge — only shown when expanded and there's history */}
              {!collapsed && id === "history" && historyCount > 0 && (
                <span
                  className={[
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    // Match the badge colour to the active/inactive state of the button
                    active
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/[0.06] text-gray-500",
                  ].join(" ")}
                >
                  {historyCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom identity block ── */}
      {/* Shows maker info when expanded; just the avatar when collapsed */}
      {!collapsed ? (
        // EXPANDED: full identity block with name, role, availability, and app tagline
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2.5">
            {/* AO monogram avatar */}
            <div className="w-7 h-7 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F59E0B] text-[10px] font-bold tracking-wide">AO</span>
            </div>
            <div className="min-w-0">
              {/* Name and role */}
              <p className="text-white font-semibold text-xs leading-tight">Abayomi Omotoso</p>
              <p className="text-amber-500/70 text-[10px] truncate">Product Designer</p>
            </div>
          </div>

          {/* Pulsing green "Open to work" status indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-green-400 text-xs">Open to work</span>
          </div>

          {/* App tagline / year */}
          <p className="text-gray-700 text-[10px]">Case Study Writer · 2026</p>
        </div>
      ) : (
        // COLLAPSED: just the AO avatar centred at the bottom
        <div className="flex justify-center py-3 border-t border-white/[0.06]">
          <div className="w-7 h-7 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center">
            <span className="text-[#F59E0B] text-[10px] font-bold tracking-wide">AO</span>
          </div>
        </div>
      )}
    </aside>
  );
}
