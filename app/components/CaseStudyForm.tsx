"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import CaseStudyOutput from "./CaseStudyOutput";

interface FormData {
  projectName: string;
  role: string;
  problem: string;
  process: string;
  keyDecisions: string;
  outcomes: string;
  tools: string;
  duration: string;
}

const EMPTY_FORM: FormData = {
  projectName: "",
  role: "",
  problem: "",
  process: "",
  keyDecisions: "",
  outcomes: "",
  tools: "",
  duration: "",
};

const fields = [
  {
    key: "projectName" as const,
    label: "Project Name",
    placeholder: "e.g. Redesigning the Checkout Flow",
    type: "input",
    span: "half",
  },
  {
    key: "role" as const,
    label: "Your Role",
    placeholder: "e.g. Lead Product Designer",
    type: "input",
    span: "half",
  },
  {
    key: "duration" as const,
    label: "Duration",
    placeholder: "e.g. 3 months (Jan–Mar 2024)",
    type: "input",
    span: "half",
  },
  {
    key: "tools" as const,
    label: "Tools Used",
    placeholder: "e.g. Figma, React, Mixpanel, Notion",
    type: "input",
    span: "half",
  },
  {
    key: "problem" as const,
    label: "The Problem",
    placeholder:
      "What was the core challenge? What constraints existed? Why did it matter?",
    type: "textarea",
    span: "full",
    rows: 3,
  },
  {
    key: "process" as const,
    label: "Your Process & Approach",
    placeholder:
      "How did you tackle the problem? What steps did you take? What methods did you use?",
    type: "textarea",
    span: "full",
    rows: 3,
  },
  {
    key: "keyDecisions" as const,
    label: "Key Decisions",
    placeholder:
      "What were the critical decision points? What trade-offs did you navigate?",
    type: "textarea",
    span: "full",
    rows: 3,
  },
  {
    key: "outcomes" as const,
    label: "Outcomes & Impact",
    placeholder:
      "What were the results? Include metrics if possible (e.g. 40% reduction in drop-off rate, shipped on time under budget).",
    type: "textarea",
    span: "full",
    rows: 3,
  },
];

interface Props {
  onGenerated?: (projectName: string, content: string) => void;
}

export default function CaseStudyForm({ onGenerated }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput("");
    setDone(false);
    setError("");
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Something went wrong");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let fullOutput = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const chunk = decoder.decode(value, { stream: true });
        fullOutput += chunk;
        setOutput((prev) => prev + chunk);
      }

      setDone(true);
      onGenerated?.(form.projectName, fullOutput);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setForm(EMPTY_FORM);
    setOutput("");
    setDone(false);
    setError("");
    setLoading(false);
  };

  const isFormReady = form.projectName.trim().length > 0;

  if (output || loading) {
    return (
      <CaseStudyOutput
        output={output}
        loading={loading}
        done={done}
        projectName={form.projectName}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-300 text-xs font-medium tracking-wide uppercase">
            Built by Abayomi Omotoso
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
          Turn your work into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            compelling stories
          </span>
        </h1>
        <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
          Your work deserves a great story. Let&apos;s write it together.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map((field) => {
              const isFullSpan = field.span === "full";
              return (
                <div
                  key={field.key}
                  className={isFullSpan ? "sm:col-span-2" : ""}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {field.label}
                  </label>
                  {field.type === "input" ? (
                    <input
                      type="text"
                      name={field.key}
                      value={form[field.key]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition text-sm"
                    />
                  ) : (
                    <textarea
                      name={field.key}
                      value={form[field.key]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition text-sm resize-none leading-relaxed"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormReady || loading}
              className="w-full bg-[#F59E0B] hover:bg-amber-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your case study…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Case Study
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
