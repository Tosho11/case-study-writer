"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface Props {
  output: string;
  loading: boolean;
  done: boolean;
  projectName: string;
  onReset: () => void;
}

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
  const [copied, setCopied] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);

  // Set editable HTML once when generation completes — never again,
  // so React doesn't overwrite the user's edits on re-renders.
  useEffect(() => {
    if (done && editableRef.current && output) {
      editableRef.current.innerHTML = markdownToHtml(output);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    const text = editableRef.current?.innerText ?? output;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {loading && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            )}
            <h2 className="text-xl font-semibold text-white">
              {loading ? "Writing your case study…" : projectName || "Your Case Study"}
            </h2>
          </div>
          {done && (
            <p className="text-gray-500 text-sm">
              Click to edit · then copy to your portfolio
            </p>
          )}
        </div>

        {done && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
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

      {/* Output box */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8 min-h-[300px]">
        {output ? (
          <>
            {/* Streaming view — plain React render, not editable */}
            {!done && (
              <div className="cursor-blink">
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

            {/* Editable view — shown once generation is complete */}
            {done && (
              <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning
                className="outline-none focus:ring-2 focus:ring-amber-500/30 focus:rounded-lg"
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Starting generation…</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
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
