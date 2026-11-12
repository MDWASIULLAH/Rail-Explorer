export default function Footer() {
  const year = 2026;

  return (
    <footer className="rail-footer bg-slate-950 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.svg" alt="Rail Explorer" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-white">Rail Explorer</span>
            </div>
            <p className="text-sm text-slate-400">
              Explore train routes and coach layouts, or use your ticket to find a berth in 3D.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Data Sources</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Train schedules and running updates come from connected data providers. Coach
              layouts are reference models based on published railway information, not official
              RDSO drawings.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This is an independent educational project. Not affiliated with Indian Railways,
              IRCTC, or the Ministry of Railways. Dimensions and berth positions are approximate.
              Always verify official information before travel.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="rail-footer-quote text-sm">Routes, coaches, and seats — together in one place.</p>
          <p className="mt-3 text-xs text-slate-500">
            &copy; {year} Rail Explorer. An independent project.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            3D passenger: <a href="https://bake3d.ai/free-3d-models" className="underline hover:text-slate-300">Old Man by Bake3D</a>, modified under <a href="https://creativecommons.org/licenses/by/4.0/" className="underline hover:text-slate-300">CC BY 4.0</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
