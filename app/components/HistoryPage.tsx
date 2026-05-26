"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, ChevronLeft, Copy, Check, Clock } from "lucide-react";
import type { HistoryItem } from "../types";

// ─── Markdown → HTML ────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInlineHtml(text: string): string {
  return escapeHtml(text).replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="text-white font-semibold">$1</strong>'
  );
}

function markdownToHtml(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      html.push(
        `<h2 class="text-xs font-bold tracking-widest uppercase text-amber-400 mt-6 mb-2 first:mt-0">${escapeHtml(line.replace(/^## /, ""))}</h2>`
      );
    } else if (line.startsWith("# ")) {
      html.push(
        `<h1 class="text-lg font-bold text-white mb-3">${escapeHtml(line.replace(/^# /, ""))}</h1>`
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
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
      continue;
    } else if (line.trim() === "") {
      html.push('<div class="h-1"></div>');
    } else {
      html.push(
        `<p class="text-gray-300 text-sm leading-relaxed mb-1">${renderInlineHtml(line)}</p>`
      );
    }
    i++;
  }

  return html.join("");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── History detail (full editable view) ────────────────────────────────────

function HistoryDetail({
  item,
  onBack,
}: {
  item: HistoryItem;
  onBack: () => void;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = markdownToHtml(item.content);
    }
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    const text = editableRef.current?.innerText ?? item.content;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to history
        </button>
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

      {/* Title + date */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{item.projectName}</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Generated {formatDate(item.generatedAt)}
        </p>
      </div>

      {/* Editable output */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <p className="text-gray-600 text-xs mb-4">Click anywhere to edit</p>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          className="outline-none focus:ring-2 focus:ring-amber-500/30 focus:rounded-lg"
        />
      </div>
    </div>
  );
}

// ─── History list ────────────────────────────────────────────────────────────

interface Props {
  items: HistoryItem[];
  onDelete: (id: string) => void;
}

export default function HistoryPage({ items, onDelete }: Props) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  // If the selected item gets deleted from outside, clear the selection
  useEffect(() => {
    if (selected && !items.find((i) => i.id === selected.id)) {
      setSelected(null);
    }
  }, [items, selected]);

  if (selected) {
    return <HistoryDetail item={selected} onBack={() => setSelected(null)} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">History</h1>
        <p className="text-gray-500 text-sm">
          {items.length} case {items.length === 1 ? "study" : "studies"} saved
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all cursor-pointer"
            onClick={() => setSelected(item)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm mb-1 truncate">
                  {item.projectName}
                </p>
                <p className="text-gray-600 text-xs mb-2">
                  {formatDate(item.generatedAt)}
                </p>
                {item.preview && (
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                    {item.preview}
                  </p>
                )}
              </div>
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
    </div>
  );
}
