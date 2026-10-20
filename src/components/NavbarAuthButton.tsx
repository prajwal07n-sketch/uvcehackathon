'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ShieldCheck,
  LogOut,
  PlusCircle,
  Layers,
  ChevronDown,
  Building2,
  Check,
  ArrowRight,
  Zap,
} from 'lucide-react';

export default function NavbarAuthButton() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fallback demo user sync
  const [demoUser, setDemoUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    // Fetch current user and available test accounts
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setDemoUser(data.user);
          setAllUsers(data.availableUsers || []);
        }
      })
      .catch((e) => console.error('Auth button fetch error:', e));

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine active profile from either NextAuth session or demo active user
  const activeUser = session?.user
    ? {
        id: (session.user as any).id,
        name: session.user.name || 'Campus Student',
        email: session.user.email,
        usn: (session.user as any).usn || '1UV22EC012',
        department: (session.user as any).department || 'Engineering',
        role: (session.user as any).role || 'STUDENT',
        trustScore: (session.user as any).trustScore ?? 100,
        image: session.user.image,
      }
    : demoUser;

  const handleSwitchUser = async (userId: string) => {
    try {
      await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setDropdownOpen(false);
      window.location.reload();
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  // Instant, clean logout handler with complete state clearing
  const handleInstantLogout = async () => {
    try {
      // 1. Clear browser local / session caches
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // 2. Clear server auth cookies via logout API
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

      // 3. Clear demo cookie on client
      document.cookie = 'campus_user_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // 4. Sign out of NextAuth and redirect cleanly to signin
      if (session) {
        await signOut({ callbackUrl: '/auth/signin?loggedOut=true' });
      } else {
        router.push('/auth/signin?loggedOut=true');
        router.refresh();
      }
    } catch {
      router.push('/auth/signin?loggedOut=true');
      router.refresh();
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-800 animate-pulse border border-slate-700"></div>
    );
  }

  // If no user is logged in (neither NextAuth nor demo)
  if (!activeUser && status === 'unauthenticated') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="px-3.5 py-1.5 text-xs font-mono font-semibold text-slate-300 hover:text-white transition rounded-xl hover:bg-slate-900 border border-transparent"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-3.5 py-1.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-xl shadow-md shadow-sky-950/50 transition flex items-center gap-1.5"
        >
          <span>Join</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Trigger Button: Profile info + live Trust Score pill */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 p-1 pl-2.5 pr-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition shadow-lg shadow-black/20"
      >
        <div className="hidden sm:flex flex-col text-right leading-tight">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs font-bold text-slate-200">
              {activeUser?.name?.split(' ')[0] || 'Student'}
            </span>
            {activeUser?.usn && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {activeUser.usn}
              </span>
            )}
          </div>
          {/* Live Trust Score Pill */}
          <span className="inline-flex items-center justify-end gap-1 text-[10px] font-mono font-bold text-emerald-400 mt-0.5">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            {activeUser?.trustScore ?? 100} Trust Pts
          </span>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-600 to-blue-700 border border-sky-400/30 flex items-center justify-center text-xs font-bold text-white shadow-inner">
          {activeUser?.image ? (
            <img src={activeUser.image} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{activeUser?.name?.slice(0, 2).toUpperCase() || 'ST'}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Visible One-Click Switch Account / Logout Button in Navbar Header */}
      <button
        type="button"
        onClick={handleInstantLogout}
        title="Switch Account / Logout"
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 font-mono text-xs transition shadow-md shadow-black/30 group"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">Switch ID</span>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100">
          {/* Identity Header */}
          <div className="p-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white leading-tight">{activeUser?.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                  {activeUser?.email}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border ${
                  activeUser?.role === 'LAB_ADMIN'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : 'bg-sky-950 text-sky-300 border-sky-800'
                }`}
              >
                {activeUser?.role || 'STUDENT'}
              </span>
            </div>

            {/* Department & Trust Bar */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>USN / Roll No:</span>
                <span className="font-bold text-slate-200">{activeUser?.usn || 'Pending Setup'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Department:</span>
                <span className="text-slate-300 truncate max-w-[140px]">
                  {activeUser?.department || 'Engineering'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Trust Score:
                </span>
                <span className="font-extrabold text-emerald-400">
                  {activeUser?.trustScore ?? 100} Points
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="py-1.5 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>My Borrowings & Lending Dashboard</span>
            </Link>

            <Link
              href="/upload"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>List Hardware Component or CAD</span>
            </Link>

            {activeUser?.role === 'LAB_ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-purple-300 hover:text-white hover:bg-purple-950/50 transition border border-purple-900/40"
              >
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Lab Coordinator Panel</span>
              </Link>
            )}
          </div>

          {/* Peer & Coordinator Account Switcher (For Demo & Reviews) */}
          <div className="py-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 block mb-1">
              Switch Test Account
            </span>
            <div className="space-y-1">
              {allUsers.map((u) => {
                const isCurrent = u.id === activeUser?.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition ${
                      isCurrent
                        ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {u.role} • {u.usn}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                      <span>{u.trustScore}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign Out / Switch ID Action */}
          <div className="pt-2">
            <button
              onClick={handleInstantLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-bold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 rounded-xl transition border border-rose-800/60 shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Switch Account / Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
