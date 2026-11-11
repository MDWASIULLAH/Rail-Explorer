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
  Star,
  Volume2,
  BellRing,
  ShieldAlert,
  ArrowLeftRight,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStarredTrains } from '@/context/StarredTrainsContext';
import { useSeatSwap } from '@/context/SeatSwapContext';
import { trainAudio } from '@/lib/train-audio';
import UserProfileModal from '@/components/ui/UserProfileModal';

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

// 5 Core Primary Links
const primaryNavLinks = [
  { href: '/', label: 'Home', icon: Train },
  { href: '/live-status', label: 'Live Status', icon: Radio, isLive: true },
  { href: '/seat-swap', label: 'Seat Swap', icon: ArrowLeftRight },
  { href: '/station/BBS', label: 'Station Board', icon: Building2 },
  { href: '/pnr', label: 'PNR', icon: Ticket },
];

// Secondary Links inside "More ▾" dropdown
const secondaryNavLinks = [
  { href: '/search', label: 'Coach Explorer', icon: Search, desc: 'Search trains & 3D rake blueprints' },
  { href: '/compare', label: 'Compare Coaches', icon: GitCompare, desc: 'Side-by-side RDSO specifications' },
  { href: '/seat-finder', label: 'Berth Finder', icon: MapPin, desc: 'Locate seat bays & neighbors' },
  { href: '/library', label: 'Coach Library', icon: BookOpen, desc: 'LHB, ICF & Vande Bharat guides' },
  { href: '/about', label: 'About Platform', icon: Info, desc: 'Architecture, safety & RDSO specs' },
];

export default function NavigationHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [hornBlasting, setHornBlasting] = useState(false);

  const { user, logout } = useAuth();
  const { starredTrains, setIsDrawerOpen, setIsAlarmModalOpen, setIsSosModalOpen } = useStarredTrains();
  const { isProfileModalOpen, setIsProfileModalOpen, incomingProposals } = useSeatSwap();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleHorn = () => {
    setHornBlasting(true);
    trainAudio.playHorn(1.2);
    setTimeout(() => setHornBlasting(false), 1200);
  };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingSwapsCount = incomingProposals.filter((p) => p.status === 'PENDING').length;

  return (
    <>
      <header className="rail-site-header sticky top-0 z-50 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="rail-brand-mark w-10 h-10 rounded-xl overflow-hidden transition-shadow ring-1 ring-slate-500/35 bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.svg" alt="Rail Explorer" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="rail-brand-name font-bold text-white text-sm tracking-tight">Rail Explorer</span>
                <span className="rail-brand-caption hidden sm:block text-[10px] text-slate-400 -mt-0.5">Indian Railway 3D Platform</span>
              </div>
            </Link>

            {/* Desktop Nav: 5 Core Links + More Dropdown */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryNavLinks.map(({ href, label, icon: Icon, isLive }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
                >
                  <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isLive ? 'text-emerald-400' : ''}`} />
                  <span>{label}</span>
                  {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition ${
                    moreMenuOpen
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-[60] animate-in fade-in zoom-in-95 duration-100">
                    {secondaryNavLinks.map(({ href, label, icon: Icon, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 transition text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-blue-300 transition">{label}</p>
                          <p className="text-[10px] text-slate-400">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Actions: Horn, Starred Drawer, User Profile (Gated by Auth) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {user ? (
                <>
                  {/* Quick Locomotive Horn Blast */}
                  <button
                    onClick={handleHorn}
                    title="Blast Authentic WAP-7 Locomotive Air Horn (370 Hz / 311 Hz)"
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition text-xs flex items-center gap-1.5 font-bold active:scale-95 ${
                      hornBlasting
                        ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105 shadow-lg shadow-amber-400/30'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/80 shadow'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 text-amber-400 ${hornBlasting ? 'animate-bounce text-slate-950' : ''}`} />
                    <span className="hidden md:inline font-mono text-[11px] text-amber-300">Horn</span>
                  </button>

                  {/* Quick Starred Trains Drawer Trigger */}
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    title="View Starred Trains & Live Status"
                    className="flex items-center gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 transition text-xs font-semibold text-amber-300 shadow active:scale-95"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="hidden sm:inline">Starred</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      {starredTrains.length}
                    </span>
                  </button>

                  {/* User Profile Button with Notification Badge */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 py-1 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs relative"
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
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />

                      {pendingSwapsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-900 animate-pulse" />
                      )}
                    </button>

                    {/* Elevated Profile Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800">
                        {/* Top: User Info & Direct Profile Modal Trigger */}
                        <div className="p-2 pb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {user.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsProfileModalOpen(true);
                            }}
                            className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center justify-between transition"
                          >
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>View Profile & Seat Swaps</span>
                            </span>
                            <span className="text-[10px] opacity-80">Open →</span>
                          </button>
                        </div>

                        {/* Middle: Seat Swap Activity Highlight */}
                        <div className="py-2 space-y-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800/80 rounded-lg transition text-left"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-semibold">My Seat Swaps</span>
                            </div>
                            {pendingSwapsCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                                {pendingSwapsCount} Offer!
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Hub</span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsDrawerOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>Starred Trains</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{starredTrains.length}</span>
                          </button>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsAlarmModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition text-left"
                          >
                            <BellRing className="w-3.5 h-3.5 text-amber-400" />
                            <span>Station Wake Alarm</span>
                          </button>

                          <Link
                            href="/pnr"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition text-left"
                          >
                            <Ticket className="w-3.5 h-3.5 text-sky-300" />
                            <span>PNR Predictions</span>
                          </Link>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsSosModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg transition text-left"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>Emergency SOS (139)</span>
                          </button>
                        </div>

                        {/* Bottom: Sign Out */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <GoogleMiniIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
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

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav className="lg:hidden bg-slate-900 border-t border-slate-700/50 pb-4 max-h-[85vh] overflow-y-auto">
            {user ? (
              <div className="px-5 py-3 border-b border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
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

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>View Full Profile & Seat Swaps</span>
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

            {/* Quick Tools Row for Mobile (Logged-In Users) */}
            {user && (
              <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-xs">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-amber-300 font-semibold flex flex-col items-center gap-1 text-center"
                >
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-[10px]">Starred ({starredTrains.length})</span>
                </button>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setIsAlarmModalOpen(true);
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-300 font-semibold flex flex-col items-center gap-1 text-center"
                >
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px]">Wake Alarm</span>
                </button>

                <button
                  onClick={() => {
                    handleHorn();
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-blue-300 font-semibold flex flex-col items-center gap-1 text-center"
                >
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px]">WAP-7 Horn</span>
                </button>
              </div>
            )}

            {/* Primary Navigation Links */}
            <div className="py-2">
              <span className="px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Main Menu
              </span>
              {primaryNavLinks.map(({ href, label, icon: Icon, isLive }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-6 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{label}</span>
                  </div>
                  {isLive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </Link>
              ))}
            </div>

            {/* Secondary Navigation Links */}
            <div className="pt-2 border-t border-slate-800">
              <span className="px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Tools & Blueprints
              </span>
              {secondaryNavLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Global User Profile & Seat Swap Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
