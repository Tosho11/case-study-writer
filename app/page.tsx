import CaseStudyForm from "./components/CaseStudyForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0c0c10]">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.12) 0%, transparent 70%)`,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(90deg, #F59E0B 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top-right: open to work + avatar */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Open to work</span>
        </div>
        <div className="w-9 h-9 rounded-full border-2 border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center">
          <span className="text-[#F59E0B] text-xs font-bold tracking-wide">AO</span>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 sm:py-20">

        {/* Personal intro */}
        <div className="mb-14">

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Hi, I&apos;m Abayomi.
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
            I am a Product Designer based in Birmingham, UK.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
            I built this tool to help new designers turn their project and product notes into compelling portfolio case studies in minutes.
          </p>
        </div>

        <CaseStudyForm />

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-10">
          Built by Abayomi Omotoso · Product Designer · 2026
        </p>
      </div>
    </main>
  );
}
