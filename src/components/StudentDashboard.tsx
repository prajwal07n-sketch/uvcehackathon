'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  PackageCheck,
  UploadCloud,
  Download,
  Calendar,
  MapPin,
  RefreshCw,
  Box,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  LogOut,
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lending' | 'cad' | 'trust'>('borrowed');
  const [borrowedTransactions, setBorrowedTransactions] = useState<any[]>([]);
  const [lendingTransactions, setLendingTransactions] = useState<any[]>([]);
  const [cadResources, setCadResources] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, borrowRes, lendRes, cadRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/transactions?scope=borrowed'),
        fetch('/api/transactions?scope=lent'),
        fetch('/api/cad'),
      ]);

      const userData = await userRes.json();
      const borrowData = await borrowRes.json();
      const lendData = await lendRes.json();
      const cadData = await cadRes.json();

      setUser(userData.user);
      setBorrowedTransactions(borrowData.transactions || []);
      setLendingTransactions(lendData.transactions || []);
      // Filter CAD resources uploaded by the current student
      if (userData.user) {
        setCadResources(
          (cadData.resources || []).filter((r: any) => r.uploaderId === userData.user.id)
        );
      }
    } catch (e) {
      console.error('Error loading student dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusTransition = async (txId: string, nextStatus: string, meetupSpot?: string) => {
    setActionLoading(txId);
    setStatusNotice(null);
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus,
          meetupSpot: meetupSpot || 'Central Library Maker Hub',
          handoverNotes: `Status updated to ${nextStatus} via Student Dashboard on ${new Date().toLocaleDateString()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update transaction status');

      setStatusNotice(data.message || `Transaction transitioned to ${nextStatus}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error executing transition');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateDaysLeft = (targetDate: string) => {
    const end = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 3600 * 24));
    return diff;
  };

  const handleInstantLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      document.cookie = 'campus_user_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      await signOut({ callbackUrl: '/auth/signin?loggedOut=true' });
      router.push('/auth/signin?loggedOut=true');
      router.refresh();
    } catch {
      router.push('/auth/signin?loggedOut=true');
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Student Identity Profile */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-500/50 flex items-center justify-center text-xl font-bold text-sky-300 shadow-xl shadow-sky-950/50 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.slice(0, 2).toUpperCase() || 'ST'
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user?.name || 'Engineering Student'}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  {user?.role || 'STUDENT'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Institutional Domain
                </span>
              </div>

              <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1.5 flex flex-wrap items-center gap-3">
                <span>USN: <strong className="text-slate-200">{user?.usn || '1UV22EC012'}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-slate-200">{user?.department || 'Engineering'}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-slate-200">{user?.email || 'student@campus.edu'}</strong></span>
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstantLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 font-mono text-xs transition shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Switch Account / Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Trust Score Spotlight Box */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 backdrop-blur-md shadow-lg shadow-emerald-950/30">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Campus Trust Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                  {user?.trustScore ?? 115}
                </span>
                <span className="text-xs font-mono text-emerald-500/80">/ Tier 1 Honor</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Zero security deposits required on items &lt; ₹5,000
              </span>
            </div>
          </div>
        </div>

        {/* Global Quick Metrics Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Borrowed Items</span>
            <p className="text-xl font-bold font-mono text-sky-400 mt-1">
              {borrowedTransactions.filter((t) => t.status === 'CHECKED_OUT').length}
            </p>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Lending Requests Pending</span>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">
              {lendingTransactions.filter((t) => t.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">CAD Assets Shared</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{cadResources.length}</p>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Community CAD Downloads</span>
            <p className="text-xl font-bold font-mono text-purple-400 mt-1">
              {cadResources.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-xs font-mono text-emerald-400 hover:text-white uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'borrowed', label: 'My Borrowed Hardware', count: borrowedTransactions.length, icon: Cpu },
          { id: 'lending', label: 'Hardware Lent to Peers', count: lendingTransactions.length, icon: PackageCheck },
          { id: 'cad', label: 'My CAD & 3D Repositories', count: cadResources.length, icon: Box },
          { id: 'trust', label: 'Trust Score & History', count: null, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/50 shadow-lg shadow-sky-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={fetchData}
          className="ml-auto p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: BORROWED HARDWARE */}
      {activeTab === 'borrowed' && (
        <div className="space-y-4">
          {borrowedTransactions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800/80 p-8">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Active Hardware Borrowings</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                You haven&apos;t reserved or borrowed any development boards, sensors, or lab tools yet. Browse campus inventory to get started!
              </p>
              <Link
                href="/hardware"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold uppercase tracking-wider transition"
              >
                Explore Hardware Pool
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {borrowedTransactions.map((tx) => {
                const daysLeft = calculateDaysLeft(tx.endDate);
                const isOverdue = daysLeft < 0;
                const isCheckedOut = tx.status === 'CHECKED_OUT';

                return (
                  <div
                    key={tx.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
                            {tx.hardware.category}
                          </span>
                          <h4 className="text-base font-bold text-white mt-1.5 leading-snug">
                            {tx.hardware.title}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg uppercase tracking-wide border ${
                            tx.status === 'CHECKED_OUT'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : tx.status === 'APPROVED'
                              ? 'bg-sky-950/80 text-sky-400 border-sky-800'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      {/* Due Countdown Pill */}
                      {isCheckedOut && (
                        <div
                          className={`mt-3 p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            isOverdue
                              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                              : daysLeft <= 2
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                              : 'bg-sky-950/50 border-sky-800/80 text-sky-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>
                              {isOverdue
                                ? `OVERDUE BY ${Math.abs(daysLeft)} DAYS`
                                : `${daysLeft} Days Remaining Until Due Date`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Return: {new Date(tx.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 space-y-2 text-xs font-mono text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          <span>Meetup / Lab Location: <strong className="text-slate-200">{tx.meetupSpot || tx.hardware.campusLocation}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Dates: {new Date(tx.startDate).toLocaleDateString()} → {new Date(tx.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>Lender: <strong className="text-slate-200">{tx.hardware.owner.name}</strong> ({tx.hardware.owner.department})</span>
                        </div>
                      </div>

                      {tx.handoverNotes && (
                        <p className="mt-2 text-[11px] text-slate-400 italic">
                          &quot;{tx.handoverNotes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Step guidance */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      {tx.status === 'PENDING' && (
                        <span className="text-[11px] font-mono text-amber-400">
                          Waiting for {tx.hardware.owner.name} to confirm reservation
                        </span>
                      )}
                      {tx.status === 'APPROVED' && (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-sky-400">
                            Ready for in-person campus pickup!
                          </span>
                          <button
                            onClick={() => handleStatusTransition(tx.id, 'CHECKED_OUT')}
                            disabled={actionLoading === tx.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition"
                          >
                            Confirm Handover Received
                          </button>
                        </div>
                      )}
                      {tx.status === 'CHECKED_OUT' && (
                        <span className="text-[11px] font-mono text-emerald-400">
                          Actively in use for project. Return to {tx.hardware.owner.name} to earn +15 Trust Score!
                        </span>
                      )}
                      {tx.status === 'RETURNED' && (
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Completed. +15 Trust points credited to your profile.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HARDWARE LENT TO PEERS */}
      {activeTab === 'lending' && (
        <div className="space-y-4">
          {lendingTransactions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800/80 p-8">
              <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Peer Lending Requests Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                List unused microcontrollers, sensors, or robotics hardware from your lab or project kit to help other campus engineers and build your Trust Score!
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold uppercase tracking-wider transition"
              >
                List Hardware Component
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
                          {tx.hardware.category}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5 leading-snug">
                          {tx.hardware.title}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg uppercase tracking-wide border ${
                          tx.status === 'CHECKED_OUT'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : tx.status === 'APPROVED'
                            ? 'bg-sky-950/80 text-sky-400 border-sky-800'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Borrower:</span>
                        <span className="font-bold text-slate-200">
                          {tx.borrower.name} ({tx.borrower.usn})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Borrower Trust Score:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {tx.borrower.trustScore} pts
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Requested Window:</span>
                        <span className="text-slate-300">
                          {new Date(tx.startDate).toLocaleDateString()} → {new Date(tx.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Campus Pickup Spot:</span>
                        <span className="text-sky-400 font-semibold truncate max-w-[200px]">
                          {tx.meetupSpot || tx.hardware.campusLocation}
                        </span>
                      </div>
                    </div>

                    {tx.handoverNotes && (
                      <p className="mt-2 text-[11px] text-slate-400 italic">
                        Borrower note: &quot;{tx.handoverNotes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Lender Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                    {tx.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(tx.id, 'CANCELLED')}
                          disabled={actionLoading === tx.id}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() =>
                            handleStatusTransition(
                              tx.id,
                              'APPROVED',
                              tx.hardware.campusLocation || 'Central Library Ground Floor'
                            )
                          }
                          disabled={actionLoading === tx.id}
                          className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-bold transition shadow-md"
                        >
                          Approve Request
                        </button>
                      </>
                    )}

                    {tx.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusTransition(tx.id, 'CHECKED_OUT')}
                        disabled={actionLoading === tx.id}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold transition shadow-md"
                      >
                        Confirm Physical Handover
                      </button>
                    )}

                    {tx.status === 'CHECKED_OUT' && (
                      <button
                        onClick={() => handleStatusTransition(tx.id, 'RETURNED')}
                        disabled={actionLoading === tx.id}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold transition shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Safe Return (+15 Score to Peer)
                      </button>
                    )}

                    {tx.status === 'RETURNED' && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Item safely returned. Hardware back in circulation.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAD REPOSITORIES */}
      {activeTab === 'cad' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Your Uploaded 3D Engineering Assemblies</h3>
            <Link
              href="/upload"
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              Publish New CAD Package
            </Link>
          </div>

          {cadResources.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800/80 p-8">
              <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No CAD Files Published Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                Share open-source gearboxes, custom enclosures, sensor mounts, or procedural OpenSCAD scripts with your university peers.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold uppercase tracking-wider transition"
              >
                Upload First CAD Assembly
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cadResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-400 border border-sky-800">
                          {res.fileFormat} MESH
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{res.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        {res.downloadsCount} downloads
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {res.description}
                    </p>

                    <div className="mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-500 block">CAD Software</span>
                        <span className="text-slate-200">{res.softwareUsed}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Material</span>
                        <span className="text-slate-200">{res.materialRecommendation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      License: {res.licenseType}
                    </span>
                    <Link
                      href={`/cad-hub/${res.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1"
                    >
                      Open 3D Viewer
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRUST SCORE BREAKDOWN */}
      {activeTab === 'trust' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Campus Trust Score Architecture</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                A non-profit academic reputation protocol replacing monetary barriers with peer accountability.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-mono font-extrabold text-emerald-400">
                {user?.trustScore ?? 115}
              </span>
              <span className="text-xs font-mono text-slate-400">Total Points</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-900/40">
              <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">
                +15 POINTS
              </span>
              <h4 className="text-sm font-semibold text-white">On-Time Safe Hardware Return</h4>
              <p className="text-xs text-slate-400 mt-1">
                Returned hardware in inspected working condition within the approved date window.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-sky-900/40">
              <span className="text-xs font-mono text-sky-400 font-bold block mb-1">
                +10 POINTS
              </span>
              <h4 className="text-sm font-semibold text-white">Hardware / CAD Community Contribution</h4>
              <p className="text-xs text-slate-400 mt-1">
                Listing physical components or publishing verified 3D CAD parametric assemblies.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-rose-900/40">
              <span className="text-xs font-mono text-rose-400 font-bold block mb-1">
                -15 TO -20 POINTS
              </span>
              <h4 className="text-sm font-semibold text-white">Overdue or Damaged Returns</h4>
              <p className="text-xs text-slate-400 mt-1">
                Late handovers or component faults lock high-value lab checkout privileges until resolved.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-950/40 to-emerald-950/40 p-4 rounded-2xl border border-sky-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Tier 1 Elite Student Privileges Unlocked</p>
                <p className="text-[11px] font-mono text-slate-400">
                  Eligible for overnight checkout of Rigol Oscilloscopes and mmWave Radars with zero cash deposit.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-500/40">
              Active Privilege
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
