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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:py-20">

        <CaseStudyForm />

        {/* Footer */}
        <div className="mt-10 text-center space-y-1.5">
          <p className="text-gray-700 text-xs">
            Built by Abayomi Omotoso · Product Designer · Birmingham, UK · 2026
          </p>
          <p className="text-gray-600 text-xs">
            A free tool to help designers turn project notes into compelling portfolio case studies.
          </p>
        </div>
      </div>
    </main>
  );
}
