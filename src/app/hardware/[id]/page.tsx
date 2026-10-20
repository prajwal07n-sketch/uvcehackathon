import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import HardwareBookingCard from '@/components/HardwareBookingCard';

export default async function HardwareDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const item = await prisma.hardwareItem.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          usn: true,
          department: true,
          trustScore: true,
          role: true,
          avatar: true,
        },
      },
      transactions: {
        where: { status: { in: ['APPROVED', 'CHECKED_OUT'] } },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  let parsedSpecs: Record<string, any> = {};
  try {
    parsedSpecs = JSON.parse(item.specs || '{}');
  } catch {
    parsedSpecs = {};
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/hardware"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hardware Inventory</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visuals, Deep Specs, Usage Rules */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-72 sm:h-96 w-full bg-slate-950">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-sm">
                  NO HARDWARE IMAGE
                </div>
              )}

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-slate-900/90 text-sky-400 border border-sky-800 backdrop-blur-md">
                  {item.category}
                </span>
                <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-950/90 text-emerald-400 border border-emerald-800 backdrop-blur-md">
                  {item.condition} CONDITION
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {item.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed font-sans">
                  {item.description || 'Verified engineering component available for university project development.'}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Technical Parameters & Pinout Architecture
                </h3>
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 divide-y divide-slate-800/80 text-xs font-mono">
                  {Object.entries(parsedSpecs).map(([key, val]) => (
                    <div key={key} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <span className="text-slate-500 uppercase tracking-wide">{key}</span>
                      <span className="text-slate-200 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Meetup Guidelines */}
              <div className="p-4 bg-sky-950/20 border border-sky-800/50 rounded-2xl space-y-2 text-xs font-mono">
                <span className="text-sky-400 font-bold uppercase block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Campus Meetup & Lab Handover Protocol
                </span>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  The designated pickup spot is <strong>{item.campusLocation}</strong>. Both the lender and borrower will verify power-on test readiness upon physical handover.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Card */}
        <div className="lg:col-span-5 space-y-6">
          <HardwareBookingCard item={item as any} />
        </div>
      </div>
    </div>
  );
}
