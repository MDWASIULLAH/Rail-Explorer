import SearchBar from '@/components/ui/SearchBar';
import HeroTrainBackground from '@/components/home/HeroTrainBackground';
import AutoExplodeShowcase from '@/components/home/AutoExplodeShowcase';
import { Train, Eye, GitCompare, MapPin, BarChart3, Radio, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { KNOWN_TRAINS } from '@/data/train-directory';

const popularTrains = ['18403', '12301', '12951', '22436']
  .map((trainNumber) => KNOWN_TRAINS[trainNumber])
  .filter(Boolean);

const features = [
  {
    icon: Radio,
    title: 'Live Train Running Status',
    description: 'Follow reported train positions, station stops, and route progress on one clear map and timeline.',
    href: '/live-status',
    badge: 'Live status',
  },
  {
    icon: Eye,
    title: '3D Train Simulation',
    description: 'See the rake in order, then step inside a coach to explore its seats and berths.',
    href: '/search',
    badge: '3D view',
  },
  {
    icon: MapPin,
    title: 'Exact Seat Finder',
    description: 'Find your berth in the coach layout and see its bay and nearby seats.',
    href: '/seat-finder',
  },
  {
    icon: GitCompare,
    title: 'Coach Comparison',
    description: 'Compare any two coach types side by side. Dimensions, berths, air conditioning, and amenities.',
    href: '/compare',
  },
  {
    icon: BarChart3,
    title: 'Platform Coach Locator',
    description: 'Check coach order and platform position when that information is available.',
    href: '/search',
  },
  {
    icon: Ticket,
    title: 'PNR 3D Berth Locator',
    description: 'Look up a 10-digit PNR and open the assigned coach in the 3D view.',
    href: '/pnr',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="home-hero relative overflow-hidden min-h-[700px] flex flex-col justify-center">
        {/* Animated 3D Running Train Background */}
        <HeroTrainBackground />

        <div className="home-hero-content relative max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 z-10 w-full">
          <div className="text-center max-w-3xl mx-auto">
            {/* A quiet label keeps the first action clear without competing with the search. */}
            <Link
              href="/live-status"
              className="home-live-link inline-flex items-center gap-2 px-3.5 py-1.5 border rounded-full text-xs font-semibold mb-6 transition-colors group backdrop-blur-md"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-300" />
              <span>Live status and route stops</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <h1 className="home-hero-title text-4xl sm:text-5xl lg:text-6xl text-white mb-5 leading-tight drop-shadow-md">
              Find your train.{' '}
              <span className="home-hero-accent">Follow the journey.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
              Check reported running updates, follow the route, and take a closer look inside the coaches.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto mb-6">
              <SearchBar />
            </div>

            {/* Quick Live Tracking Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="text-slate-300 font-medium mr-1">Try a train</span>
              {popularTrains.map((train) => (
                <Link key={train.trainNumber} href={`/live-status/${train.trainNumber}`} className="min-h-11 px-3 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-600/70 transition">
                  {train.trainNumber} {train.trainName}
                </Link>
              ))}
            </div>
          </div>

          {/* Interactive Auto-Explode Showcase Widget */}
          <AutoExplodeShowcase />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">A few useful ways to explore</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Start with a train, a station, or the seat number on your ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="home-feature-card group relative border p-6 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="home-feature-icon w-11 h-11 rounded-xl flex items-center justify-center transition-transform">
                    <feature.icon className="w-5 h-5 text-sky-200" />
                  </div>
                  {feature.badge && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-sky-200 transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-sky-300 group-hover:text-sky-200 font-medium">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="home-cta rounded-2xl border p-8 sm:p-12 text-center">
          <Train className="w-10 h-10 text-sky-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Have a train number?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Search by number or name to see the route and open its coach layout.
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
