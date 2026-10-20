'use client';

import React, { useState } from 'react';
import { ShieldCheck, MapPin, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface HardwareItemData {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  specs: string;
  condition: string;
  maintenanceFee: number;
  securityDeposit: number;
  campusLocation: string;
  status: string;
  imageUrl?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    department: string;
    trustScore: number;
    role: string;
    avatar?: string | null;
  };
  transactions?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

interface HardwareBookingCardProps {
  item: HardwareItemData;
  onBookSuccess?: () => void;
}

export default function HardwareBookingCard({ item, onBookSuccess }: HardwareBookingCardProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Parse specs
  let parsedSpecs: Record<string, any> = {};
  try {
    parsedSpecs = JSON.parse(item.specs || '{}');
  } catch {
    parsedSpecs = {};
  }

  // Calculate days
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const daysDiff = start && end && end > start ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) : 0;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!startDate || !endDate) {
      setError('Please specify both the start date and expected return date.');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Return date must be strictly after the start date.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hardwareId: item.id,
          startDate,
          endDate,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking request');
      }

      setSuccess(data.message || 'Booking request submitted! The lender will review and approve.');
      if (onBookSuccess) onBookSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while booking');
    } finally {
      setLoading(false);
    }
  };

  const isAvailable = item.status === 'AVAILABLE';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Media / Banner */}
      <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono text-sm">
            NO IMAGE SPECIFIED
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-900/90 text-sky-400 border border-sky-800/80 backdrop-blur-md">
            {item.category}
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md backdrop-blur-md border ${
              item.condition === 'NEW'
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800'
                : item.condition === 'GOOD'
                ? 'bg-sky-950/90 text-sky-400 border-sky-800'
                : 'bg-amber-950/90 text-amber-400 border-amber-800'
            }`}
          >
            {item.condition} CONDITION
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md uppercase tracking-wider backdrop-blur-md border ${
              isAvailable
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : item.status === 'BOOKED'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
            }`}
          >
            ● {item.status}
          </span>
        </div>

        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950/70 px-2 py-1 rounded backdrop-blur-md">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{item.campusLocation}</span>
        </div>
      </div>

      {/* Item Info Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
            {item.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description || 'Verified campus engineering resource available for academic and lab projects.'}
          </p>

          {/* Technical Specs Pills */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(parsedSpecs).slice(0, 3).map(([key, val]) => (
              <span
                key={key}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700/60"
              >
                <span className="text-slate-500">{key}:</span> {String(val)}
              </span>
            ))}
          </div>
        </div>

        {/* Lender Profile Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
              {item.owner.avatar ? (
                <img src={item.owner.avatar} alt={item.owner.name || 'Owner'} className="w-full h-full object-cover" />
              ) : (
                (item.owner.name || 'ST').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 leading-none">
                {item.owner.name}
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {item.owner.department} • {item.owner.role}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              {item.owner.trustScore} pts
            </span>
          </div>
        </div>

        {/* Fee & Deposit Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Lab Maintenance</span>
            <span className="font-bold text-slate-200">
              {item.maintenanceFee === 0 ? '₹0 (Free Sharing)' : `₹${item.maintenanceFee}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Refundable Deposit</span>
            <span className="font-bold text-sky-400">
              {item.securityDeposit === 0 ? '₹0 (Trust-Based)' : `₹${item.securityDeposit}`}
            </span>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleBookingSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={!isAvailable || loading}
                required
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                disabled={!isAvailable || loading}
                required
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Project details (e.g. Capstone Rover test)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isAvailable || loading}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          {daysDiff > 0 && (
            <p className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Duration: {daysDiff} days reservation window
            </p>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isAvailable || loading}
            className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 shadow-lg ${
              isAvailable
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-sky-900/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Checking Double-Booking...
              </span>
            ) : isAvailable ? (
              <>
                Request Hardware Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              'Currently Unavailable'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
