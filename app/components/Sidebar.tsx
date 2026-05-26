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
        collapsed ? "lg:w-16 w-56" : "w-56",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* ── Header: logo + collapse toggle ── */}
      <div className="flex items-center border-b border-white/[0.06] h-[56px] px-3 gap-2">
        {collapsed ? (
          /* Collapsed: small Sparkles + expand chevron */
          <>
            <button
              onClick={() => onNavChange("generate")}
              title="Generate"
              className="text-amber-400 hover:text-amber-300 transition-colors p-1"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="ml-auto text-gray-500 hover:text-white transition-colors p-1 hidden lg:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Expanded: Casely wordmark + collapse chevron */
          <>
            <button
              onClick={() => onNavChange("generate")}
              className="text-white font-bold text-lg tracking-tight hover:text-amber-400 transition-colors flex-1 text-left"
            >
              Casely
            </button>
            {/* Desktop collapse button */}
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden lg:flex text-gray-500 hover:text-white transition-colors p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Nav items (compact) ── */}
      <nav className="flex-1 px-2 py-3 space-y-0">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = nav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              title={collapsed ? label : undefined}
              className={[
                "w-full flex items-center rounded-lg text-sm font-medium transition-all border",
                collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-3 py-1.5",
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

      {/* ── Bottom: identity ── */}
      {!collapsed ? (
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F59E0B] text-[10px] font-bold tracking-wide">AO</span>
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
      ) : (
        <div className="flex justify-center py-3 border-t border-white/[0.06]">
          <div className="w-7 h-7 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center">
            <span className="text-[#F59E0B] text-[10px] font-bold tracking-wide">AO</span>
          </div>
        </div>
      )}
    </aside>
  );
}
