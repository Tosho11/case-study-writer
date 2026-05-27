// ─────────────────────────────────────────────────────────────────────────────
// components/CaseStudyOutput.tsx — Displays the generated case study
//
// This component has two modes:
//   1. STREAMING — While the AI is still writing, it renders the arriving text
//      as React nodes (read-only) with a blinking cursor animation.
//   2. DONE — Once generation completes, it converts the markdown to HTML and
//      injects it into a contentEditable div so the user can click and edit
//      the text directly before copying it.
//
// The copy button reads from the editable div's innerText (not the raw output)
// so any edits the user made are included in what gets copied.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";

// ── Props passed in from CaseStudyForm ───────────────────────────────────────
interface Props {
  output: string;       // The full (or partial during streaming) markdown text
  loading: boolean;     // True while the stream is still active
  done: boolean;        // True once the stream has fully completed
  projectName: string;  // Shown as the title above the output
  onReset: () => void;  // Callback to return to the empty form
}

// ── HTML escaping — prevents raw user/AI text from breaking the HTML ──────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Converts **bold** markdown syntax to an HTML <strong> tag ────────────────
function renderInlineHtml(text: string): string {
  return escapeHtml(text).replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="text-white font-semibold">$1</strong>'
  );
}

// ── Converts the full markdown output to an HTML string ──────────────────────
// Used once generation is done to populate the contentEditable div.
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
      // Collect consecutive list items into a single <ul>
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
      continue; // Skip the i++ at the bottom since we already advanced i
    } else if (line.trim() === "") {
      // Empty line — add a small spacer div
      html.push('<div class="h-1"></div>');
    } else {
      // Regular paragraph line
      html.push(
        `<p class="text-gray-300 text-sm leading-relaxed mb-1">${renderInlineHtml(line)}</p>`
      );
    }
    i++;
  }

  return html.join("");
}

// ── Renders **bold** inline markdown as React nodes (used during streaming) ───
// This is separate from markdownToHtml because during streaming we render
// React elements directly rather than injecting HTML strings.
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function CaseStudyOutput({
  output,
  loading,
  done,
  projectName,
  onReset,
}: Props) {

  // Tracks whether the "Copied!" confirmation is showing
  const [copied, setCopied] = useState(false);

  // Ref to the contentEditable div — used to set innerHTML and read edited text
  const editableRef = useRef<HTMLDivElement>(null);

  // ── Convert markdown to HTML and inject it once generation completes ──────
  // We use useEffect with [done] so this only runs once — when done flips to true.
  // We never update innerHTML again after this, which means React won't overwrite
  // any edits the user makes inside the div.
  useEffect(() => {
    if (done && editableRef.current && output) {
      editableRef.current.innerHTML = markdownToHtml(output);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Copy the current (possibly edited) text to the clipboard ─────────────
  // Reads from innerText so edits the user made are included
  const handleCopy = async () => {
    const text = editableRef.current?.innerText ?? output;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset the "Copied!" label after 2s
  };

  return (
    <div className="animate-fade-in">

      {/* ── Top bar: title + action buttons ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          {/* Show a spinner + "Writing…" during generation, then the project name */}
          <div className="flex items-center gap-2 mb-1">
            {loading && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            )}
            <h2 className="text-xl font-semibold text-white">
              {loading ? "Writing your case study…" : projectName || "Your Case Study"}
            </h2>
          </div>
          {/* Hint shown once generation is done to tell the user they can edit */}
          {done && (
            <p className="text-gray-500 text-sm">
              Click to edit · then copy to your portfolio
            </p>
          )}
        </div>

        {/* Copy and "Write another" buttons — only visible once generation is done */}
        {done && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              {/* Toggle between "Copy" and "Copied!" based on state */}
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
            {/* Returns the user to the blank form to generate another case study */}
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-amber-400 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Write another
            </button>
          </div>
        )}
      </div>

      {/* ── Main output box ── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8 min-h-[300px]">
        {output ? (
          <>
            {/* STREAMING VIEW: rendered as React nodes while text is arriving */}
            {!done && (
              <div className="cursor-blink"> {/* CSS class adds a blinking cursor */}
                {output.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="text-xs font-bold tracking-widest uppercase text-amber-400 mt-6 mb-2 first:mt-0"
                      >
                        {line.replace(/^## /, "")}
                      </h2>
                    );
                  } else if (line.startsWith("# ")) {
                    return (
                      <h1 key={i} className="text-lg font-bold text-white mb-3">
                        {line.replace(/^# /, "")}
                      </h1>
                    );
                  } else if (line.trim() === "") {
                    return <div key={i} className="h-1" />;
                  } else if (line.startsWith("- ") || line.startsWith("* ")) {
                    return (
                      <li
                        key={i}
                        className="text-gray-300 text-sm leading-relaxed ml-4 list-disc"
                      >
                        {renderInline(line.replace(/^[-*] /, ""))}
                      </li>
                    );
                  } else {
                    return (
                      <p
                        key={i}
                        className="text-gray-300 text-sm leading-relaxed mb-1"
                      >
                        {renderInline(line)}
                      </p>
                    );
                  }
                })}
              </div>
            )}

            {/* DONE VIEW: contentEditable div — user can click and type to edit */}
            {/* innerHTML is set once via useEffect above; React never touches it again */}
            {done && (
              <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning // Suppresses React's warning about editable divs
                className="outline-none focus:ring-2 focus:ring-amber-500/30 focus:rounded-lg"
              />
            )}
          </>
        ) : (
          // Shown briefly before the first chunk arrives
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Starting generation…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom action bar — duplicate buttons for convenience ── */}
      {done && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copied to clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to clipboard
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Write another
          </button>
        </div>
      )}
    </div>
  );
}
