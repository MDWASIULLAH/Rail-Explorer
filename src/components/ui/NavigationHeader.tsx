'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Train, Search, Menu, X, MapPin, GitCompare, BookOpen, Info, Ticket, Radio, Building2 } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: Train },
  { href: '/live-status', label: 'Live Status', icon: Radio, isLive: true },
  { href: '/station/BBS', label: 'Station Board', icon: Building2 },
  { href: '/search', label: 'Explorer', icon: Search },
  { href: '/pnr', label: 'PNR', icon: Ticket },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/seat-finder', label: 'Seat Finder', icon: MapPin },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/about', label: 'About', icon: Info },
];

export default function NavigationHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">Rail Explorer</span>
              <span className="hidden sm:block text-[10px] text-slate-400 -mt-0.5">Indian Railway 3D Platform</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, isLive }: any) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
              >
                <Icon className={`w-4 h-4 ${isLive ? 'text-emerald-400' : ''}`} />
                <span>{label}</span>
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden bg-slate-900 border-t border-slate-700/50 pb-4">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

