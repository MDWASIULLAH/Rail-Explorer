import { Info, Train, Database, Code, Shield, AlertTriangle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-12">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Info className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">About This Project</h1>
        <p className="text-slate-400">Indian Railway 3D Explorer — Data Sources & Accuracy</p>
      </div>

      <div className="space-y-6">
        {/* Project */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Train className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Project Overview</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            The Indian Railway 3D Explorer is an interactive platform that allows users to explore
            Indian Railway trains in 3D. Users can search by train number, PNR, or train name to
            visualize complete train compositions, inspect individual coaches, locate specific
            berths, compare coach types, and calculate distances between coaches.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mt-3">
            The platform combines live railway data from the Railway Engine API with a comprehensive
            coach specification database and procedurally generated 3D models to create an
            educational and practical tool for passengers and railway enthusiasts.
          </p>
        </section>

        {/* Technology */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Frontend', value: 'Next.js, React, TypeScript' },
              { label: 'Styling', value: 'Tailwind CSS' },
              { label: '3D Engine', value: 'Three.js, React Three Fiber, Drei' },
              { label: 'State', value: 'Zustand' },
              { label: 'API', value: 'Railway Engine (REST)' },
              { label: 'Icons', value: 'Lucide React' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Data Sources</h2>
          </div>
          <div className="space-y-3 text-sm">
            {[
              {
                source: 'Railway Engine API',
                url: 'https://railexplorer.vercel.app',
                data: 'Live train status, schedules, routes, coach composition, PNR lookup, station data',
                confidence: 'Live data — accuracy depends on upstream providers',
              },
              {
                source: 'RDSO (Research Designs & Standards Organisation)',
                url: 'https://rdso.indianrailways.gov.in',
                data: 'Official coach dimensions, berth specifications, safety standards',
                confidence: 'High — official Indian Railways standards body',
              },
              {
                source: 'Wikipedia & IRIMEE',
                url: 'https://en.wikipedia.org/wiki/LHB_coach',
                data: 'LHB and ICF coach general specifications, history, comparisons',
                confidence: 'Medium — cross-referenced with official sources',
              },
              {
                source: 'Railway enthusiast communities',
                url: '',
                data: 'Berth numbering patterns, rake compositions, practical observations',
                confidence: 'Medium — verified against official numbering where possible',
              },
            ].map((src, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-white">{src.source}</p>
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">
                      Link ↗
                    </a>
                  )}
                </div>
                <p className="text-slate-400 text-xs mb-1">{src.data}</p>
                <p className="text-slate-500 text-xs italic">{src.confidence}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Accuracy */}
        <section className="bg-amber-900/20 rounded-xl border border-amber-800/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-300">Accuracy & Limitations</h2>
          </div>
          <ul className="space-y-2 text-sm text-amber-200/80">
            <li>• 3D models are <strong>procedurally generated approximations</strong>, not exact replicas of real coaches.</li>
            <li>• Coach dimensions are based on RDSO LHB standards. ICF and Vande Bharat coaches may differ.</li>
            <li>• Berth numbering follows standard Indian Railways patterns but may vary on some trains.</li>
            <li>• Coach composition from the API may not always be available or up to date.</li>
            <li>• PNR data is fetched live and depends on Railway Engine API availability.</li>
            <li>• Distance calculations are approximate, based on standard coach lengths + coupling gaps.</li>
            <li>• This is an <strong>independent educational project</strong>, not affiliated with Indian Railways or IRCTC.</li>
            <li>• Always verify official information from IRCTC or station displays before travel.</li>
          </ul>
        </section>

        {/* Security */}
        <section className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Privacy & Security</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• API keys are stored server-side and never exposed to the browser.</li>
            <li>• PNR data is fetched on demand and not stored or logged.</li>
            <li>• No personal information is retained after your session.</li>
            <li>• All API requests are proxied through Next.js API routes with rate limiting.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

