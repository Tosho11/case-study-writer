// ─────────────────────────────────────────────────────────────────────────────
// components/HistoryPage.tsx — Browse and re-read past generated case studies
//
// This file contains two components:
//
//   HistoryDetail — Full-screen view of a single case study. Renders the
//     markdown as editable HTML (same contentEditable pattern as
//     CaseStudyOutput) so the user can tweak and copy from here too.
//
//   HistoryPage (default export) — The list view. Shows all saved case studies
//     in reverse-chronological order with a search bar to filter by project name.
//     Clicking a card switches to HistoryDetail; the back button returns here.
//
// History items are passed in from page.tsx (which owns the state and persists
// it to localStorage). This component never modifies the list directly — it
// calls onDelete to ask the parent to remove an item.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, ChevronLeft, Copy, Check, Clock, Search } from "lucide-react";
import type { HistoryItem } from "../types";

// ── HTML helpers (duplicated from CaseStudyOutput — no shared lib yet) ────────

// Escapes raw text so it's safe to inject into an HTML string
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Converts **bold** markdown to an HTML <strong> tag
function renderInlineHtml(text: string): string {
  return escapeHtml(text).replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="text-white font-semibold">$1</strong>'
  );
}

// ── Converts full markdown to an HTML string for the contentEditable div ─────
// Handles: ## section headers, # titles, bullet lists, blank lines, paragraphs.
function markdownToHtml(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      // Section heading — styled in amber uppercase
      html.push(
        `<h2 class="text-xs font-bold tracking-widest uppercase text-amber-400 mt-6 mb-2 first:mt-0">${escapeHtml(line.replace(/^## /, ""))}</h2>`
      );
    } else if (line.startsWith("# ")) {
      // Top-level title
      html.push(
        `<h1 class="text-lg font-bold text-white mb-3">${escapeHtml(line.replace(/^# /, ""))}</h1>`
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Collect consecutive bullet lines into a single <ul>
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(
          `<li class="text-gray-300 text-sm leading-relaxed ml-4 list-disc">${renderInlineHtml(lines[i].replace(/^[-*] /, ""))}</li>`
        );
        i++;
      }
      html.push(`<ul class="mb-2">${items.join("")}</ul>`);
      continue; // Skip the i++ below — we already advanced i inside the while loop
    } else if (line.trim() === "") {
      // Blank line — add a small vertical spacer
      html.push('<div class="h-1"></div>');
    } else {
      // Regular paragraph
      html.push(
        `<p class="text-gray-300 text-sm leading-relaxed mb-1">${renderInlineHtml(line)}</p>`
      );
    }
    i++;
  }

  return html.join("");
}

// ── Formats an ISO date string into a human-readable date + time ─────────────
// e.g. "27 May 2026 · 3:22 PM"
function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase(); // Convert "pm" → "PM"
  return `${date} · ${time}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryDetail — Full editable view of a single saved case study
// ─────────────────────────────────────────────────────────────────────────────
function HistoryDetail({
  item,
  onBack,
}: {
  item: HistoryItem;
  onBack: () => void;
}) {
  // Ref to the contentEditable div — we set innerHTML once and then read
  // innerText when the user copies, so any edits they made are captured
  const editableRef = useRef<HTMLDivElement>(null);

  // Tracks whether the "Copied!" confirmation is showing
  const [copied, setCopied] = useState(false);

  // ── Inject the saved markdown as HTML when this detail view opens ──────────
  // Keyed on item.id so it re-runs if the user navigates from one detail
  // view directly to another (unlikely but safe).
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = markdownToHtml(item.content);
    }
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Copy the (possibly edited) content to the clipboard ──────────────────
  // Reads innerText rather than innerHTML so we get plain text, not HTML tags
  const handleCopy = async () => {
    const text = editableRef.current?.innerText ?? item.content;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2s
  };

  return (
    <div className="animate-fade-in">

      {/* ── Top toolbar: back button + copy button ── */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Returns to the history list */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to history
        </button>

        {/* Copy button — amber to make it stand out */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-amber-400 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* ── Project title + generation timestamp ── */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{item.projectName}</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Generated {formatDate(item.generatedAt)}
        </p>
      </div>

      {/* ── The contentEditable case study output ── */}
      {/* innerHTML is set once by useEffect; React never touches it again,
          so any edits the user types in the div are preserved until they navigate away */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <p className="text-gray-600 text-xs mb-4">Click anywhere to edit</p>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning  // Suppresses React's warning about editable divs
          className="outline-none focus:ring-2 focus:ring-amber-500/30 focus:rounded-lg"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryPage — The list of all saved case studies (default export)
// ─────────────────────────────────────────────────────────────────────────────

// ── Props passed in from page.tsx ────────────────────────────────────────────
interface Props {
  items: HistoryItem[];         // All saved history items (newest first)
  onDelete: (id: string) => void; // Asks page.tsx to remove an item by ID
}

export default function HistoryPage({ items, onDelete }: Props) {

  // Tracks which history item (if any) is open in the detail view
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  // The current value of the search filter input
  const [search, setSearch] = useState("");

  // ── Clear the selection if the item being viewed gets deleted externally ──
  // This can happen if the user somehow triggers a delete while viewing a detail.
  // Without this guard, the detail view would show a stale deleted item.
  useEffect(() => {
    if (selected && !items.find((i) => i.id === selected.id)) {
      setSelected(null);
    }
  }, [items, selected]);

  // ── If a card was clicked, show the full detail view instead of the list ──
  if (selected) {
    return <HistoryDetail item={selected} onBack={() => setSelected(null)} />;
  }

  // ── Empty state — no case studies have been generated yet ─────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        {/* Clock icon in a subtle circle */}
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
        </div>
        <p className="text-gray-400 text-sm font-medium mb-1">
          No case studies yet
        </p>
        <p className="text-gray-600 text-xs">
          Your generated case studies will appear here.
        </p>
      </div>
    );
  }

  // ── Filter the list based on the search query ─────────────────────────────
  // Case-insensitive match against projectName only
  const filtered = items.filter((item) =>
    item.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">

      {/* ── Page heading + item count ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">History</h1>
        <p className="text-gray-500 text-sm">
          {/* Pluralise "study" / "studies" based on count */}
          {items.length} case {items.length === 1 ? "study" : "studies"} saved
        </p>
      </div>

      {/* ── Search bar ── */}
      {/* Positioned absolutely so the Search icon overlaps the left edge of the input */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition text-sm"
        />
      </div>

      {/* ── No search results message ── */}
      {filtered.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-10">
          No case studies match &ldquo;{search}&rdquo;
        </p>
      ) : (
        // ── Card list ────────────────────────────────────────────────────────
        <div className="space-y-3">
          {filtered.map((item) => (
            // Clicking anywhere on the card opens the detail view
            <div
              key={item.id}
              className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all cursor-pointer"
              onClick={() => setSelected(item)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Project name */}
                  <p className="text-white font-medium text-sm mb-1 truncate">
                    {item.projectName}
                  </p>
                  {/* Generation date + time */}
                  <p className="text-gray-600 text-xs mb-2">
                    {formatDate(item.generatedAt)}
                  </p>
                  {/* Short preview of the first line of the case study */}
                  {item.preview && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      {item.preview}
                    </p>
                  )}
                </div>

                {/* Delete button — only visible on hover (opacity-0 → group-hover:opacity-100) */}
                {/* stopPropagation prevents the card click (setSelected) from also firing */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Delete"
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
