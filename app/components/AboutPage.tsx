export default function AboutPage() {
  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">About</h1>
        <p className="text-gray-500 text-sm">What this tool is and why it exists</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">
        {/* What it does */}
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">
            The Tool
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Case Study Writer helps product designers and builders turn rough project
            notes into polished portfolio case studies in seconds, powered by Claude AI.
          </p>
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* Who made it */}
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">
            Who Made It
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F59E0B] text-xs font-bold tracking-wide">AO</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Abayomi Omotoso</p>
              <p className="text-gray-500 text-xs">Product Designer · Birmingham, UK</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06]" />

        {/* How to use */}
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">
            How to Use It
          </h2>
          <ol className="space-y-2">
            {[
              "Fill in the Generate form — at minimum, your project name",
              "Click Generate Case Study and wait a few seconds",
              "Read through the result, click to edit anything you want to adjust",
              "Copy the finished text straight into your portfolio",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
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
