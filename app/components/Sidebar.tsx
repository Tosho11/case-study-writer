"use client";

import { Sparkles, Clock, Info, X } from "lucide-react";
import type { NavItem } from "../types";

interface Props {
  nav: NavItem;
  onNavChange: (nav: NavItem) => void;
  historyCount: number;
  open: boolean;
  onClose: () => void;
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
}: Props) {
  return (
    <aside
      className={[
        "fixed lg:static inset-y-0 left-0 z-30",
        "w-56 bg-[#0d0d12] border-r border-white/[0.06]",
        "flex flex-col flex-shrink-0",
        "transition-transform duration-200 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* App name / logo */}
      <div className="relative px-5 pt-7 pb-5 border-b border-white/[0.06]">
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-white font-bold text-lg tracking-tight">Casely</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = nav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border",
                active
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04] border-transparent",
              ].join(" ")}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {id === "history" && historyCount > 0 && (
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

      {/* Bottom: identity + label */}
      <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
        {/* Avatar + name + role */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#F59E0B] text-xs font-bold tracking-wide">AO</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs leading-tight">Abayomi Omotoso</p>
            <p className="text-amber-500/70 text-[10px] truncate">Product Designer</p>
          </div>
        </div>

        {/* Open to work */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-green-400 text-xs">Open to work</span>
        </div>

        <p className="text-gray-700 text-[10px]">Case Study Writer · 2026</p>
      </div>
    </aside>
  );
}
