"use client";

import { Sparkles, Clock, Info, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { NavItem } from "../types";

interface Props {
  nav: NavItem;
  onNavChange: (nav: NavItem) => void;
  historyCount: number;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: {
  id: NavItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "history", label: "History", icon: Clock },
  { id: "about", label: "About", icon: Info },
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
    <aside
      className={[
        "fixed lg:static inset-y-0 left-0 z-30",
        "bg-[#0d0d12] border-r border-white/[0.06]",
        "flex flex-col flex-shrink-0",
        "transition-all duration-200 ease-in-out",
        // Width: collapsed on desktop only
        collapsed ? "lg:w-16 w-56" : "w-56",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* Top: app name / logo */}
      <div className="relative flex items-center border-b border-white/[0.06] h-[60px] px-4">
        {collapsed ? (
          /* Collapsed — centred Sparkles icon, links to Generate */
          <button
            onClick={() => onNavChange("generate")}
            title="Generate"
            className="mx-auto text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        ) : (
          /* Expanded — "Casely" wordmark, links to Generate */
          <button
            onClick={() => onNavChange("generate")}
            className="text-white font-bold text-lg tracking-tight hover:text-amber-400 transition-colors"
          >
            Casely
          </button>
        )}

        {/* Mobile close — only when expanded */}
        {!collapsed && (
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = nav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              title={collapsed ? label : undefined}
              className={[
                "w-full flex items-center rounded-xl text-sm font-medium transition-all border",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04] border-transparent",
              ].join(" ")}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && id === "history" && historyCount > 0 && (
                <span
                  className={[
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
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

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:flex px-2 pb-3">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "w-full flex items-center rounded-xl text-xs text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all py-2 border border-transparent",
            collapsed ? "justify-center px-0" : "gap-2 px-3",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom: identity — hidden when collapsed */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F59E0B] text-xs font-bold tracking-wide">AO</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs leading-tight">Abayomi Omotoso</p>
              <p className="text-amber-500/70 text-[10px] truncate">Product Designer</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-green-400 text-xs">Open to work</span>
          </div>

          <p className="text-gray-700 text-[10px]">Case Study Writer · 2026</p>
        </div>
      )}

      {/* Collapsed bottom — just AO avatar */}
      {collapsed && (
        <div className="flex justify-center py-4 border-t border-white/[0.06]">
          <div className="w-8 h-8 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center">
            <span className="text-[#F59E0B] text-xs font-bold tracking-wide">AO</span>
          </div>
        </div>
      )}
    </aside>
  );
}
