'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Search,
  Download,
  Eye,
  X,
  PlusCircle,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import CadCanvasViewer from '@/components/CadCanvasViewer';

export default function CadHubPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formats = ['ALL', 'STL', 'STEP', 'OBJ', 'SCRIPT'];

  const fetchCadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFormat !== 'ALL') params.set('format', selectedFormat);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/cad?${params.toString()}`);
      const data = await res.json();
      setResources(data.resources || []);
    } catch (e) {
      console.error('Error fetching CAD resources:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedFormat, searchQuery]);

  useEffect(() => {
    fetchCadResources();
  }, [fetchCadResources]);

  const handleDownload = async (cadItem: any) => {
    setDownloadingId(cadItem.id);
    try {
      const res = await fetch(`/api/cad/${cadItem.id}/download`, {
        method: 'POST',
      });
      const data = await res.json();

      // Trigger actual browser download
      const link = document.createElement('a');
      link.href = data.fileUrl || cadItem.fileUrl;
      link.download = `${cadItem.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${cadItem.fileFormat.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment local count
      setResources((prev) =>
        prev.map((r) =>
          r.id === cadItem.id ? { ...r, downloadsCount: (r.downloadsCount || 0) + 1 } : r
        )
      );
    } catch (e) {
      console.error('Download registration failed:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            <span>Open-Source University CAD & 3D Repository</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineering Assemblies & 3D Meshes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Pre-calibrated robotic linkages, sensor enclosures, cycloidal drives, and electric vehicle stators. Rotate, inspect, and verify tolerances in 3D WebGL before 3D printing.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 shrink-0 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish CAD (+15 Pts)</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCadResources();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assemblies, gearboxes, enclosures, or CAD tools (SolidWorks, Fusion 360)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl uppercase tracking-wider transition shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Format:
          </span>
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap ${
                selectedFormat === fmt
                  ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {fmt}
            </button>
          ))}
          <span className="ml-auto text-slate-500 text-[11px] font-mono shrink-0 hidden sm:inline">
            Showing <strong className="text-slate-200">{resources.length}</strong> CAD packages
          </span>
        </div>
      </div>

      {/* Grid of CAD Resources */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400">Loading CAD models...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
          <Box className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No CAD Assemblies Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or contribute your student project CAD files to the campus pool!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((cad) => (
            <div
              key={cad.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl hover:border-slate-700/80 transition relative group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-950 text-sky-400 border border-sky-800">
                    {cad.fileFormat} MESH
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    {cad.downloadsCount}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3 line-clamp-1 group-hover:text-sky-300 transition">
                  {cad.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {cad.description}
                </p>

                {/* Technical Parameters Box */}
                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Software:</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[170px]">
                      {cad.softwareUsed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recommended Material:</span>
                    <span className="text-emerald-400 font-semibold truncate max-w-[170px]">
                      {cad.materialRecommendation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Infill:</span>
                    <span className="text-sky-400 font-bold">{cad.infillPercent}%</span>
                  </div>
                </div>

                {/* Author Info */}
                <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">By:</span>
                    <span className="text-slate-200">{cad.uploader.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {cad.fileSize}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setActiveModalItem(cad)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Eye className="w-4 h-4" />
                  <span>3D Inspect</span>
                </button>

                <button
                  onClick={() => handleDownload(cad)}
                  disabled={downloadingId === cad.id}
                  className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                  title="Download CAD File"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INTERACTIVE 3D CAD MODAL VIEWER */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-400 border border-sky-800">
                    {activeModalItem.fileFormat} MESH
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    License: {activeModalItem.licenseType}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {activeModalItem.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Created by {activeModalItem.uploader.name} ({activeModalItem.uploader.department})
                </p>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 3D WebGL Canvas Component */}
            <div className="p-4 sm:p-6 space-y-6">
              <CadCanvasViewer
                meshUrl={activeModalItem.previewMeshUrl || activeModalItem.fileUrl}
                title={activeModalItem.title}
                height="450px"
              />

              {/* Manufacturing & Tolerance Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                  <h4 className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    Manufacturing Parameters
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CAD Software:</span>
                    <span className="text-slate-200">{activeModalItem.softwareUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material Recommendation:</span>
                    <span className="text-emerald-400 font-bold">{activeModalItem.materialRecommendation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Infill Density:</span>
                    <span className="text-sky-400 font-bold">{activeModalItem.infillPercent}%</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                  <h4 className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    Tolerance & Slicing Notes
                  </h4>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    {activeModalItem.toleranceNotes || 'Standard 0.2mm layer height recommended. Test flow calibration before final mechanical assembly.'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    File Size: {activeModalItem.fileSize}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
              <Link
                href={`/cad-hub/${activeModalItem.id}`}
                className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Open Dedicated Model Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => handleDownload(activeModalItem)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>Download {activeModalItem.fileFormat} File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
