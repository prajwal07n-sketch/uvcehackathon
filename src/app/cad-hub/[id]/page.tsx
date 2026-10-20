import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Download,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import CadCanvasViewer from '@/components/CadCanvasViewer';

export default async function CadDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  let resource: any = null;
  try {
    resource = await prisma.cadResource.findUnique({
      where: { id },
      include: {
        uploader: {
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
      },
    });
  } catch (err) {
    console.warn(`CAD resource lookup notice for ${id}:`, err);
  }

  if (!resource) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/cad-hub"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CAD Hub</span>
        </Link>
      </div>

      {/* Main Grid: 3D Canvas on Left, Engineering Specs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3D Interactive Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <CadCanvasViewer
            meshUrl={resource.previewMeshUrl || resource.fileUrl}
            title={resource.title}
            height="520px"
          />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Assembly Description & Engineering Background</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {resource.description || 'Verified open-source mechanical assembly designed for engineering prototyping.'}
            </p>
          </div>
        </div>

        {/* Right Column: Metadata, Slicing parameters, Uploader profile */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-sky-950 text-sky-400 border border-sky-800">
                  {resource.fileFormat} MESH
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {resource.downloadsCount} total downloads
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-2 leading-tight">
                {resource.title}
              </h1>
            </div>

            {/* Author Profile */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-xs">
                  {resource.uploader.avatar ? (
                    <img src={resource.uploader.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    (resource.uploader.name || 'ST').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {resource.uploader.name || 'Campus Student'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {resource.uploader.department}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {resource.uploader.trustScore} pts
                </span>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="space-y-2 text-xs font-mono bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between pb-1.5 border-b border-slate-800/80">
                <span className="text-slate-500">Software Used</span>
                <span className="text-slate-200 font-semibold">{resource.softwareUsed}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-500">Target Material</span>
                <span className="text-emerald-400 font-bold">{resource.materialRecommendation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-500">Recommended Infill</span>
                <span className="text-sky-400 font-bold">{resource.infillPercent}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-500">License</span>
                <span className="text-slate-300">{resource.licenseType}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-500">Package Size</span>
                <span className="text-slate-300">{resource.fileSize}</span>
              </div>
            </div>

            {/* Tolerance Guidance */}
            <div className="p-4 bg-sky-950/30 border border-sky-800/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">
                Manufacturing & Tolerance Note
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {resource.toleranceNotes || 'Calibrate stepper extrusion flow rate before printing bearing seats.'}
              </p>
            </div>

            {/* Download Action */}
            <a
              href={resource.fileUrl}
              download
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Download {resource.fileFormat} File</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
