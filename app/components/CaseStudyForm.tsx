// ─────────────────────────────────────────────────────────────────────────────
// components/CaseStudyForm.tsx — The main input form for generating case studies
//
// This component:
//   • Renders all the form fields (project name, role, problem, etc.)
//   • Validates that the 4 required fields are filled before enabling the button
//   • Sends the form data to the /api/generate endpoint when submitted
//   • Reads the streamed response and builds the output text chunk by chunk
//   • Switches to the CaseStudyOutput component once text starts arriving
//   • Calls onGenerated() when streaming finishes to save the result to History
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import CaseStudyOutput from "./CaseStudyOutput";

// ── TypeScript type for all form fields ──────────────────────────────────────
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

// ── Default empty state — used when the form first loads or is reset ─────────
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

// ── Field configuration — drives the form rendering loop ─────────────────────
// Each entry defines how a field is displayed and whether it's required.
// Fields with span "half" sit side by side; "full" fields take the full width.
const fields = [
  {
    key: "projectName" as const,
    label: "Project Name",
    placeholder: "e.g. Redesigning the Checkout Flow",
    type: "input",
    span: "half",
    required: true,   // Required: button stays disabled without this
  },
  {
    key: "role" as const,
    label: "Your Role",
    placeholder: "e.g. Lead Product Designer",
    type: "input",
    span: "half",
    required: true,   // Required
  },
  {
    key: "duration" as const,
    label: "Duration",
    placeholder: "e.g. 3 months (Jan–Mar 2024)",
    type: "input",
    span: "half",
    required: false,  // Optional — AI will work without it
  },
  {
    key: "tools" as const,
    label: "Tools Used",
    placeholder: "e.g. Figma, React, Mixpanel, Notion",
    type: "input",
    span: "half",
    required: false,  // Optional
  },
  {
    key: "problem" as const,
    label: "The Problem",
    placeholder:
      "What was the core challenge? What constraints existed? Why did it matter?",
    type: "textarea",
    span: "full",
    rows: 3,
    required: true,   // Required
  },
  {
    key: "process" as const,
    label: "Your Process & Approach",
    placeholder:
      "How did you tackle the problem? What steps did you take? What methods did you use?",
    type: "textarea",
    span: "full",
    rows: 3,
    required: false,  // Optional
  },
  {
    key: "keyDecisions" as const,
    label: "Key Decisions",
    placeholder:
      "What were the critical decision points? What trade-offs did you navigate?",
    type: "textarea",
    span: "full",
    rows: 3,
    required: false,  // Optional
  },
  {
    key: "outcomes" as const,
    label: "Outcomes & Impact",
    placeholder:
      "What were the results? Include metrics if possible (e.g. 40% reduction in drop-off rate, shipped on time under budget).",
    type: "textarea",
    span: "full",
    rows: 3,
    required: true,   // Required
  },
];

// ── Component props ───────────────────────────────────────────────────────────
interface Props {
  // Called by the parent (page.tsx) to save the completed case study to History
  onGenerated?: (projectName: string, content: string) => void;
}

export default function CaseStudyForm({ onGenerated }: Props) {

  // Tracks the current value of every form field
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  // Accumulates the streamed text from the AI as it arrives
  const [output, setOutput] = useState("");

  // True while the API request is in flight / stream is active
  const [loading, setLoading] = useState(false);

  // True once the stream has fully completed
  const [done, setDone] = useState(false);

  // Stores any error message to display below the form
  const [error, setError] = useState("");

  // Ref to the AbortController so we can cancel the request if the user resets
  const abortRef = useRef<AbortController | null>(null);

  // ── Update a single form field when the user types ────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Handle form submission — sends data to the API and reads the stream ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset any previous output and error state before starting
    setOutput("");
    setDone(false);
    setError("");
    setLoading(true);

    // Create a new AbortController so we can cancel mid-stream if needed
    abortRef.current = new AbortController();

    try {
      // Send the form data to the Next.js API route
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: abortRef.current.signal, // Allows cancellation via handleReset
      });

      // If the server returns an error status, throw with the error message
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Something went wrong");
      }

      // Set up a stream reader to consume the response body incrementally
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      // Read chunks as they arrive and append each to the output state
      // This is what makes the text appear word by word in the UI
      let fullOutput = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break; // Stream has finished

        const chunk = decoder.decode(value, { stream: true });
        fullOutput += chunk;
        setOutput((prev) => prev + chunk); // Triggers a re-render with the new text
      }

      // Mark generation as complete and notify the parent to save to History
      setDone(true);
      onGenerated?.(form.projectName, fullOutput);

    } catch (err: unknown) {
      // Ignore AbortError — that just means the user clicked reset
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Reset everything back to the empty form ───────────────────────────────
  const handleReset = () => {
    abortRef.current?.abort(); // Cancel any in-flight request
    setForm(EMPTY_FORM);
    setOutput("");
    setDone(false);
    setError("");
    setLoading(false);
  };

  // ── Button is only enabled once all 4 required fields have content ────────
  const isFormReady =
    form.projectName.trim().length > 0 &&
    form.role.trim().length > 0 &&
    form.problem.trim().length > 0 &&
    form.outcomes.trim().length > 0;

  // ── Once output starts arriving (or is loading), show the output view ─────
  // This replaces the form with the streaming/editable case study component
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

  // ── Render the input form ─────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">

      {/* Page header — branding tag, headline, and subheading */}
      <div className="text-center mb-10">

        {/* "Built by TOSHO" badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-300 text-xs font-medium tracking-wide uppercase">
            Built by TOSHO
          </span>
        </div>

        {/* Main headline with amber gradient on "compelling stories" */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
          Turn your work into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            compelling stories
          </span>
        </h1>

        {/* Subheading beneath the headline */}
        <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
          Your work deserves a great story, let&apos;s write it together!!!
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Two-column grid for input fields; textareas span the full width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map((field) => {
              const isFullSpan = field.span === "full";
              return (
                <div
                  key={field.key}
                  className={isFullSpan ? "sm:col-span-2" : ""}
                >
                  {/* Field label — required fields get an amber asterisk */}
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {field.label}
                    {field.required && (
                      <span className="text-amber-500 ml-1">*</span>
                    )}
                  </label>

                  {/* Render a single-line input or a multi-line textarea */}
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

          {/* Error banner — shown if the API call fails */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit button + validation hint */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormReady || loading} // Disabled until 4 required fields are filled
              className="w-full bg-[#F59E0B] hover:bg-amber-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              {/* Show spinner + message while generating, otherwise show the default label */}
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

            {/* Hint text visible only when the required fields aren't all filled */}
            {!isFormReady && (
              <p className="text-center text-xs text-gray-600 mt-2">
                Fill in the 4 required fields to generate
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
