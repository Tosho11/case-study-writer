// ─────────────────────────────────────────────────────────────────────────────
// components/AboutPage.tsx — Static "About" page explaining what Casely is
//
// This is a purely static, presentational component — no state, no props,
// no API calls. It renders two sections:
//   1. A short description of what Casely does
//   2. A numbered "How to Use" guide walking the user through the workflow
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="animate-fade-in max-w-xl">

      {/* ── Page heading ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">About</h1>
        <p className="text-gray-500 text-sm">Why TOSHO built Casely?</p>
      </div>

      {/* ── Content card ── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">

        {/* ── Section 1: What Casely is ── */}
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">
            CASELY
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Casely helps product designers and builders turn rough project notes into polished portfolio case studies in seconds.
          </p>
        </div>

        {/* Divider between the two sections */}
        <div className="border-t border-white/[0.06]" />

        {/* ── Section 2: Step-by-step usage guide ── */}
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">
            How to Use CASELY
          </h2>

          {/* Numbered list — each step gets an amber circle badge with its number */}
          <ol className="space-y-2">
            {[
              "Fill in the Generate form; at minimum, The Problem, Your Role, Your Process & Approach and Outcomes & Impact",
              "Click Generate Case Study and wait a few seconds",
              "Read through the result, click to edit anything you want to adjust",
              "Copy the finished text straight into your portfolio",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                {/* Step number inside an amber-tinted circle */}
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-center mt-0.5 font-medium">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
