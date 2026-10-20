'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Search,
  PlusCircle,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import HardwareBookingCard from '@/components/HardwareBookingCard';

export default function HardwareCatalogPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'ALL',
    'Embedded Boards',
    'Sensors',
    'Actuators/Motors',
    'Robotics Parts',
    'Lab Tools',
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedCondition !== 'ALL') params.set('condition', selectedCondition);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/hardware?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error('Error fetching hardware catalog:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCondition, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Campus Hardware Resource Pool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineering Components & Instruments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time university inventory of microcontrollers, RF sensors, motor drivers, and lab testbenches available for zero-cost peer borrowing.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-sky-950/50 shrink-0 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Hardware</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by part number, title, specs, or campus lab (e.g., STM32, mmWave, Hakko)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold rounded-xl uppercase tracking-wider transition shrink-0"
          >
            Filter
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white border border-sky-500 shadow-md shadow-sky-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Condition & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="BOOKED">Currently Checked Out</option>
              <option value="MAINTENANCE">In Lab Calibration</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Conditions</option>
              <option value="NEW">New (Pristine)</option>
              <option value="GOOD">Good (Tested)</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 text-[11px]">
            Showing <strong className="text-slate-200">{items.length}</strong> components
          </div>
        </div>
      </div>

      {/* Grid of Hardware Items */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400">Loading campus hardware catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Matching Hardware Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search filters or contribute the first component in this category!
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedCondition('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono font-semibold rounded-xl transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <HardwareBookingCard
              key={item.id}
              item={item}
              onBookSuccess={() => {
                fetchItems();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
