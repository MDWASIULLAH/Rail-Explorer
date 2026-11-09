import { COACH_BLUEPRINTS, getCoachColor, type CoachCategory } from '@/data/coach-database';
import { BookOpen, Ruler, Users, Train } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const coaches = Object.values(COACH_BLUEPRINTS);
  const passengerCoaches = coaches.filter((c) => c.totalBerths > 0);
  const utilityCoaches = coaches.filter((c) => c.totalBerths === 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Railway Technical Library</h1>
        <p className="text-slate-400">Comprehensive reference for Indian Railway coach types and specifications</p>
      </div>

      {/* LHB vs ICF */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">LHB vs ICF Coaches</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-700">
                <th className="px-4 py-2 text-left">Feature</th>
                <th className="px-4 py-2 text-left">LHB (Linke Hofmann Busch)</th>
                <th className="px-4 py-2 text-left">ICF (Integral Coach Factory)</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                ['Origin', 'German design (Alstom)', 'Swiss design (SIG)'],
                ['Body Length', '23,540 mm', '21,336 mm'],
                ['Length Over Couplers', '24,000 mm', '22,280 mm'],
                ['Max Width', '3,245 mm', '3,245 mm'],
                ['Max Speed', '160 km/h (upgradable to 200)', '130 km/h'],
                ['Anti-Climbing', 'Yes', 'No'],
                ['Coupler Type', 'CBC (Center Buffer Coupler)', 'Screw Coupling'],
                ['Bogie Type', 'FIAT type', 'ICF type'],
                ['Suspension', 'Secondary air spring', 'Coil spring'],
                ['Safety', 'Much safer in collisions', 'Less safe - telescoping risk'],
                ['Sleeper Berths', '80', '72'],
                ['AC 3-Tier Berths', '72', '64'],
                ['Weight', 'Lighter (stainless steel)', 'Heavier'],
              ].map(([feature, lhb, icf], i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-medium text-white">{feature}</td>
                  <td className="px-4 py-2.5">{lhb}</td>
                  <td className="px-4 py-2.5">{icf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Source: RDSO specifications, Wikipedia, IRIMEE technical references. Values are approximate.
        </p>
      </div>

      {/* Indian Railways Coach Numbering Decoding System */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-2">Indian Railways Coach Numbering System</h2>
        <p className="text-xs text-slate-400 mb-4">
          Every Indian Railway coach painted with a 5 or 6 digit number encodes its manufacturing year and coach class:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold text-emerald-400 mb-2">First 2 Digits: Year of Manufacture</h3>
            <p className="text-slate-300 mb-2">E.g., Coach <strong className="text-white">18403</strong> or <strong className="text-white">04092</strong>:</p>
            <ul className="space-y-1 text-slate-400">
              <li>• <span className="font-mono text-white">04xxx</span> = Built in 2004</li>
              <li>• <span className="font-mono text-white">18xxx</span> = Built in 2018</li>
              <li>• <span className="font-mono text-white">22xxx</span> = Built in 2022</li>
            </ul>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold text-blue-400 mb-2">Last 3 Digits: Coach Class Category</h3>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between"><span>001 - 025:</span> <strong className="text-white">AC 1st Class (1A)</strong></div>
              <div className="flex justify-between"><span>026 - 050:</span> <strong className="text-white">AC 2-Tier (2A)</strong></div>
              <div className="flex justify-between"><span>051 - 100:</span> <strong className="text-white">AC 3-Tier (3A)</strong></div>
              <div className="flex justify-between"><span>101 - 150:</span> <strong className="text-white">AC Chair Car (CC)</strong></div>
              <div className="flex justify-between"><span>201 - 400:</span> <strong className="text-white">Sleeper Class (SL)</strong></div>
              <div className="flex justify-between"><span>401 - 600:</span> <strong className="text-white">General / Unreserved (GS)</strong></div>
              <div className="flex justify-between"><span>701 - 800:</span> <strong className="text-white">Luggage & Brake / EOG (SLR)</strong></div>
              <div className="flex justify-between"><span>801+:</span> <strong className="text-white">Pantry Car (PC)</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bogie, Coupling & Inter-Coach Engineering */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Bogie & Coupling Architecture (RDSO Standards)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <h3 className="font-bold text-amber-400 mb-1.5">FIAT-SIG Bogie</h3>
            <p className="text-slate-300 leading-relaxed">
              Standard on all LHB coaches. Wheelbase 2,560 mm, wheel diameter 915 mm (new) down to 845 mm (condemning). Features disc brakes, secondary air springs, and anti-roll bars rated for 160-200 km/h.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <h3 className="font-bold text-cyan-400 mb-1.5">AAR Tight-Lock CBC</h3>
            <p className="text-slate-300 leading-relaxed">
              Center Buffer Coupler with anti-climbing feature. Prevents coaches from capsizing or telescoping into one another during collisions, greatly enhancing passenger survivability.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <h3 className="font-bold text-purple-400 mb-1.5">Vestibuled Gangways</h3>
            <p className="text-slate-300 leading-relaxed">
              Inter-coach gangway with sealed rubber bellows and stainless steel footplates. Facilitates smooth passenger movement and train crew transit across the entire rake length.
            </p>
          </div>
        </div>
      </div>

      {/* Passenger coaches */}
      <h2 className="text-xl font-bold text-white mb-4">Passenger Coach Types</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {passengerCoaches.map((coach) => (
          <div
            key={coach.id}
            className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: coach.color }}
              >
                {coach.category}
              </div>
              <div>
                <h3 className="font-semibold text-white">{coach.name}</h3>
                <p className="text-xs text-slate-400">{coach.generation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-800 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-0.5">
                  <Users className="w-3 h-3" />
                  Berths
                </div>
                <p className="text-lg font-bold text-white">{coach.totalBerths}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-0.5">
                  <Ruler className="w-3 h-3" />
                  Length
                </div>
                <p className="text-lg font-bold text-white">{(coach.dimensions.lengthOverBody / 1000).toFixed(1)}m</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {coach.description}
            </p>

            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${coach.hasAC ? 'bg-blue-900 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                {coach.hasAC ? 'AC' : 'Non-AC'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {coach.totalBays} bays
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                {coach.toilets.count} toilets
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Utility coaches */}
      <h2 className="text-xl font-bold text-white mb-4">Utility & Service Coaches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {utilityCoaches.map((coach) => (
          <div key={coach.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: coach.color }}
              >
                {coach.category}
              </div>
              <div>
                <h3 className="font-semibold text-white">{coach.name}</h3>
                <p className="text-xs text-slate-400">{coach.generation}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{coach.description}</p>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-3">Data Sources & Confidence</h2>
        <p className="text-sm text-slate-400 mb-4">
          Coach specifications are compiled from the following sources. All measurements should
          be considered approximate unless marked as VERIFIED.
        </p>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• <strong className="text-slate-300">RDSO</strong> — Research Designs and Standards Organisation, Indian Railways</li>
          <li>• <strong className="text-slate-300">IRIMEE</strong> — Indian Railways Institute of Mechanical and Electrical Engineering</li>
          <li>• <strong className="text-slate-300">Wikipedia</strong> — LHB coach, ICF coach articles (cross-referenced)</li>
          <li>• <strong className="text-slate-300">Railway Engine API</strong> — Live train data, coach composition, PNR status</li>
          <li>• <strong className="text-slate-300">Rail enthusiast communities</strong> — Berth numbering verification</li>
        </ul>
      </div>
    </div>
  );
}

