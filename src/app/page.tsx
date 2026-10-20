import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  Cpu,
  Box,
  ShieldCheck,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Terminal,
} from 'lucide-react';
import HardwareBookingCard from '@/components/HardwareBookingCard';

export default async function HomePage() {
  // Fetch featured items with build-time & serverless fallback safety
  let featuredHardware: any[] = [];
  let trendingCad: any[] = [];
  let totalHardware = 7;
  let totalCad = 4;
  let totalUsers = 3;

  try {
    featuredHardware = await prisma.hardwareItem.findMany({
      take: 3,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            trustScore: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    trendingCad = await prisma.cadResource.findMany({
      take: 3,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            department: true,
            trustScore: true,
          },
        },
      },
      orderBy: { downloadsCount: 'desc' },
    });

    totalHardware = await prisma.hardwareItem.count();
    totalCad = await prisma.cadResource.count();
    totalUsers = await prisma.user.count();
  } catch (error) {
    console.warn('Database connection notice during build or cold start:', error);
  }

  return (
    <div className="w-full space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Blueprint background grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-600/15 via-blue-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-sky-500/30 text-sky-400 text-xs font-mono shadow-lg shadow-sky-950/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Non-Profit Peer-to-Peer & Lab-to-Peer Engineering Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Build Faster.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400">
              Share Hardware.
            </span>{' '}
            Print Open CAD.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate project delays and reduce electronic waste. Borrow microcontrollers, sensors, and lab instruments from campus labs and fellow engineering students, or inspect and download community 3D CAD files.
          </p>

          {/* Quick Search Box */}
          <div className="max-w-2xl mx-auto pt-4">
            <form
              action="/hardware"
              method="GET"
              className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md focus-within:border-sky-500 transition"
            >
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5 text-sky-400" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Search STM32, mmWave Radar, Cycloidal Gear, Hakko..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shrink-0 shadow-lg shadow-sky-950/50"
              >
                Search Campus
              </button>
            </form>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/hardware"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold uppercase tracking-wide transition shadow-lg shadow-sky-900/40"
            >
              <Cpu className="w-4 h-4" />
              Explore Hardware Inventory
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/cad-hub"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold uppercase tracking-wide transition"
            >
              <Box className="w-4 h-4 text-emerald-400" />
              Inspect 3D CAD Hub
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left font-mono">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 block">
                {totalHardware}+
              </span>
              <span className="text-xs text-slate-400 uppercase mt-0.5 block">
                Lab & Peer Boards
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 block">
                {totalCad}+
              </span>
              <span className="text-xs text-slate-400 uppercase mt-0.5 block">
                Tested CAD Meshes
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 block">
                {totalUsers}+
              </span>
              <span className="text-xs text-slate-400 uppercase mt-0.5 block">
                Verified Students
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 block">
                ₹0
              </span>
              <span className="text-xs text-slate-400 uppercase mt-0.5 block">
                Non-Profit Fees
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW CAMPUS TRUST WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Financial Gatekeeping
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            The Campus Trust Score Protocol
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Instead of demanding large security deposits from broke engineering students, Campus-Share runs on peer reputation and institutional accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Institutional Auth',
              desc: 'Sign in exclusively using your verified university email (.edu / .ac.in) linked to your Student USN and Department.',
              icon: Terminal,
              accent: 'text-sky-400 border-sky-800/40 bg-sky-950/30',
            },
            {
              step: '02',
              title: 'Conflict-Free Booking',
              desc: 'Select your project reservation dates. Automatic backend conflict engines prevent overlapping double-bookings.',
              icon: Calendar,
              accent: 'text-blue-400 border-blue-800/40 bg-blue-950/30',
            },
            {
              step: '03',
              title: 'Campus Meetup Handover',
              desc: 'Pick up components at designated campus hubs (Central Library Maker Hub, Innovation Lab, Instrumentation Dept).',
              icon: MapPin,
              accent: 'text-purple-400 border-purple-800/40 bg-purple-950/30',
            },
            {
              step: '04',
              title: 'Earn +15 Trust Score',
              desc: 'Return components on time in working condition to earn Trust Score points, unlocking overnight access to high-tier instruments.',
              icon: ShieldCheck,
              accent: 'text-emerald-400 border-emerald-800/40 bg-emerald-950/30',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={`p-6 rounded-2xl border ${item.accent} flex flex-col justify-between shadow-xl space-y-4`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black opacity-40">{item.step}</span>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: FEATURED HARDWARE COMPONENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
              <Cpu className="w-4 h-4" />
              <span>Campus Hardware Pool</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready for Immediate In-Person Checkout
            </h2>
          </div>
          <Link
            href="/hardware"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-400 hover:text-sky-300 uppercase transition"
          >
            <span>View All {totalHardware} Components</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredHardware.map((item) => (
            <HardwareBookingCard key={item.id} item={item as any} />
          ))}
        </div>
      </section>

      {/* SECTION 4: TRENDING 3D CAD ASSETS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              <Box className="w-4 h-4" />
              <span>Open-Source CAD & 3D Repository</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pre-Calibrated Robotic & Mechanical Assemblies
            </h2>
          </div>
          <Link
            href="/cad-hub"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 uppercase transition"
          >
            <span>Browse Full CAD Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingCad.map((cad) => (
            <div
              key={cad.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded bg-sky-950 text-sky-400 border border-sky-800">
                    {cad.fileFormat} MESH
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {cad.downloadsCount} downloads
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3 line-clamp-1">
                  {cad.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {cad.description}
                </p>

                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material:</span>
                    <span className="text-slate-300 truncate max-w-[160px]">
                      {cad.materialRecommendation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Infill:</span>
                    <span className="text-emerald-400 font-bold">{cad.infillPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Author:</span>
                    <span className="text-slate-300">{cad.uploader.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">{cad.fileSize}</span>
                <Link
                  href={`/cad-hub/${cad.id}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5" />
                  Inspect in 3D
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-emerald-950 rounded-3xl p-8 sm:p-12 border border-sky-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Have unused development kits or CAD models?
            </h2>
            <p className="text-sm text-sky-100 leading-relaxed">
              Don&apos;t let ESP32s or motor controllers sit in storage drawers. Share them with your university peers, earn Campus Trust Points, and keep student engineering thriving!
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/upload"
                className="px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-mono text-xs font-bold uppercase tracking-wider transition shadow-xl"
              >
                List Hardware or CAD Model
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-white border border-white/20 font-mono text-xs font-bold uppercase tracking-wider transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
