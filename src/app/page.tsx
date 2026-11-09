import SearchBar from '@/components/ui/SearchBar';
import HeroTrainBackground from '@/components/home/HeroTrainBackground';
import AutoExplodeShowcase from '@/components/home/AutoExplodeShowcase';
import { Train, Eye, GitCompare, MapPin, BarChart3, Zap, Radio, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Radio,
    title: 'Live Train Running Status',
    description: 'Real-time train tracking with Where Is My Train-style vertical timeline, station ETAs, and interactive map.',
    href: '/live-status',
    color: 'from-rose-500 to-rose-700',
    badge: 'LIVE GPS',
  },
  {
    icon: Eye,
    title: '3D Train Simulation',
    description: 'View complete train rake composition in 3D. Click any coach to inspect interior berths.',
    href: '/search',
    color: 'from-blue-500 to-blue-700',
    badge: 'INTERACTIVE',
  },
  {
    icon: MapPin,
    title: 'Exact Seat Finder',
    description: 'Enter your berth number and see its exact position, bay layout, window alignment, and nearest doors.',
    href: '/seat-finder',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    icon: GitCompare,
    title: 'Coach Comparison',
    description: 'Compare any two coach types side by side. Dimensions, berths, air conditioning, and amenities.',
    href: '/compare',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: BarChart3,
    title: 'Platform Coach Locator',
    description: 'Know exactly where your coach halts on the platform and walking distance from footbridges (FOB).',
    href: '/search',
    color: 'from-amber-500 to-amber-700',
  },
  {
    icon: Ticket,
    title: 'PNR 3D Berth Locator',
    description: 'Check 10-digit PNR status and jump straight into 3D inside your allocated coach and berth.',
    href: '/pnr',
    color: 'from-cyan-500 to-cyan-700',
  },
];

const stats = [
  { label: 'Coach Blueprints', value: '10+' },
  { label: 'Berth Layouts', value: '8' },
  { label: 'Max Berths/Coach', value: '83' },
  { label: 'Live Station Tracks', value: '8,000+' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[700px] flex flex-col justify-center">
        {/* Animated 3D Running Train Background */}
        <HeroTrainBackground />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 z-10 w-full">
          <div className="text-center max-w-3xl mx-auto">
            {/* Live Status Promo Badge */}
            <Link
              href="/live-status"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 rounded-full text-rose-300 text-xs font-bold mb-6 transition-colors shadow-lg shadow-rose-900/40 group backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>NEW: Where Is My Train Live Status & Route Timeline</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight tracking-tight drop-shadow-md">
              Explore Your Train.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                Track Live & View in 3D.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
              Real-time running status, animated railway timeline, coach sequencing,
              platform locator, and realistic 3D interior seat exploration for Indian Railways.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto mb-6">
              <SearchBar />
            </div>

            {/* Quick Live Tracking Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400 font-semibold">Live Popular Trains:</span>
              <Link href="/live-status/18403" className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition shadow">
                18403 Barbil Exp
              </Link>
              <Link href="/live-status/12301" className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition shadow">
                12301 Howrah Rajdhani
              </Link>
              <Link href="/live-status/12951" className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition shadow">
                12951 Mumbai Rajdhani
              </Link>
              <Link href="/live-status/22436" className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition shadow">
                22436 Vande Bharat
              </Link>
            </div>
          </div>

          {/* Interactive Auto-Explode Showcase Widget */}
          <AutoExplodeShowcase />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800/50 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Platform Features</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            A comprehensive railway intelligence tool built for passengers and railway enthusiasts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  {feature.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-gradient-to-br from-blue-950/80 to-slate-900 rounded-2xl border border-blue-800/30 p-8 sm:p-12 text-center">
          <Train className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Explore?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Enter any Indian train number to see its complete composition in interactive 3D.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Train className="w-5 h-5" />
            Start Exploring
          </Link>
        </div>
      </section>
    </div>
  );
}
