'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Cpu,
  Box,
  Layers,
  PlusCircle,
  Building2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import NavbarAuthButton from './NavbarAuthButton';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/hardware', label: 'Hardware Inventory', icon: Cpu },
    { href: '/cad-hub', label: 'CAD & 3D Hub', icon: Box },
    { href: '/dashboard', label: 'Lend & Borrow', icon: Layers },
    { href: '/admin', label: 'Lab Coordinator', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-lg shadow-sky-950/60 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-sky-400 group-hover:text-emerald-400 transition" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-mono">
                CAMPUS<span className="text-sky-400">-SHARE</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-widest hidden sm:inline-block">
                NON-PROFIT
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 leading-none">
              Peer Hardware & CAD Platform
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                  active
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Dynamic Auth Button + Action Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/upload"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-md shadow-sky-950/50 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List / Share</span>
          </Link>

          {/* Dynamic User Authentication & Status Widget */}
          <NavbarAuthButton />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-mono font-medium ${
                  active ? 'bg-sky-600/20 text-sky-400' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/upload"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-600 text-white font-mono text-xs font-bold uppercase mt-3"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Component or CAD</span>
          </Link>

          <button
            type="button"
            onClick={async () => {
              setMobileMenuOpen(false);
              if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
              }
              await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
              document.cookie = 'campus_user_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              router.push('/auth/signin?loggedOut=true');
              router.refresh();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 font-mono text-xs font-bold uppercase mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
