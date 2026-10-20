'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Cpu,
  Clock,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export default function AdminCoordinatorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleMaintenance = async (itemId: string, currentStatus: string) => {
    setUpdatingId(itemId);
    try {
      const newStatus = currentStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
      const res = await fetch(`/api/hardware/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      await fetchStats();
    } catch {
      alert('Error updating maintenance status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1.5">
              <Building2 className="w-4 h-4" />
              <span>Center for Robotics & Instrumentation • Institutional Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Lab Coordinator & Inventory Panel
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Supervise campus-owned hardware loans, maintain university oscilloscope/radar calibration logs, and manage the student peer Trust Score ledger.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Hardware</span>
            <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
              {data?.stats?.hardwareCount ?? '-'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Loans</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 block">
              {data?.stats?.activeTransactionsCount ?? '-'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Pending Bookings</span>
            <span className="text-2xl font-extrabold font-mono text-amber-400 mt-1 block">
              {data?.stats?.pendingCount ?? '-'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">3D CAD Models</span>
            <span className="text-2xl font-extrabold font-mono text-purple-400 mt-1 block">
              {data?.stats?.cadCount ?? '-'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Verified Students</span>
            <span className="text-2xl font-extrabold font-mono text-sky-400 mt-1 block">
              {data?.stats?.userCount ?? '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Campus Inventory Management on Left, Category Breakdown & Recent Transactions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hardware Inventory Status */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span>Campus Hardware Operational Status</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {data?.hardwareItems?.length ?? 0} Listed Items
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Lab Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.hardwareItems?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-xs font-sans line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Owner: {item.owner.name} ({item.owner.role})
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                        {item.campusLocation}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'AVAILABLE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : item.status === 'BOOKED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleMaintenance(item.id, item.status)}
                          disabled={updatingId === item.id}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                            item.status === 'MAINTENANCE'
                              ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {item.status === 'MAINTENANCE' ? 'Mark Available' : 'Set Maintenance'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Category Distribution & Recent Checkouts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Category Distribution</span>
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {data?.categoryStats?.map((cat: any) => (
                <div key={cat.category} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/60">
                  <span className="text-slate-300">{cat.category}</span>
                  <span className="font-bold text-sky-400">{cat._count.id} items</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Loans */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Recent Transaction Stream</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              {data?.recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate max-w-[180px]">
                      {tx.hardware.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Borrower: {tx.borrower.name}</span>
                    <span className="text-emerald-400">{tx.borrower.trustScore} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
