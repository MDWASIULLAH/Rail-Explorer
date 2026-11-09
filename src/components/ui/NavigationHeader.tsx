'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  Train,
  Search,
  Menu,
  X,
  MapPin,
  GitCompare,
  BookOpen,
  Info,
  Ticket,
  Radio,
  Building2,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function GoogleMiniIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">Rail Explorer</span>
              <span className="hidden sm:block text-[10px] text-slate-400 -mt-0.5">Indian Railway 3D Platform</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon, isLive }: any) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs xl:text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
              >
                <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isLive ? 'text-emerald-400' : ''}`} />
                <span>{label}</span>
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Actions: Google Sign-in / User Profile */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 py-1 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-6 h-6 rounded-full border border-blue-400/50 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-slate-200 max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>

                    <Link
                      href="/live-status"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Status</span>
                    </Link>

                    <Link
                      href="/pnr"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <Ticket className="w-3.5 h-3.5 text-purple-400" />
                      <span>PNR Predictions</span>
                    </Link>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <GoogleMiniIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden bg-slate-900 border-t border-slate-700/50 pb-4">
          {user ? (
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-blue-400/50 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-800">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-md"
              >
                <GoogleMiniIcon className="w-4 h-4" />
                <span>Sign In with Google</span>
              </Link>
            </div>
          )}

          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm"
            >
              <Icon className="w-5 h-5 text-slate-400" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
