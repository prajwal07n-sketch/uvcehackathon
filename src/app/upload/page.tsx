'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cpu,
  Box,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'hardware' | 'cad'>('hardware');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hardware Form State
  const [hwTitle, setHwTitle] = useState('');
  const [hwCategory, setHwCategory] = useState('Embedded Boards');
  const [hwCondition, setHwCondition] = useState('GOOD');
  const [hwLocation, setHwLocation] = useState('Central Library Maker Hub');
  const [hwMaintenance, setHwMaintenance] = useState('0');
  const [hwDeposit, setHwDeposit] = useState('0');
  const [hwDescription, setHwDescription] = useState('');
  const [hwSpecsJson, setHwSpecsJson] = useState(
    JSON.stringify({ voltage: '3.3V / 5V', interfaces: 'I2C, SPI, UART' }, null, 2)
  );
  const [hwImageUrl, setHwImageUrl] = useState('');

  // CAD Form State
  const [cadTitle, setCadTitle] = useState('');
  const [cadFormat, setCadFormat] = useState('STL');
  const [cadSoftware, setCadSoftware] = useState('Autodesk Fusion 360');
  const [cadMaterial, setCadMaterial] = useState('PETG / Carbon Fiber PLA');
  const [cadInfill, setCadInfill] = useState('40');
  const [cadLicense, setCadLicense] = useState('CC-BY-SA 4.0');
  const [cadTolerance, setCadTolerance] = useState('0.15mm mechanical clearance');
  const [cadDescription, setCadDescription] = useState('');
  const [cadFileUrl, setCadFileUrl] = useState('/cad-models/cycloidal-gearbox.stl');

  // Hardware Submit
  const handleHardwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let parsedSpecs = {};
      try {
        parsedSpecs = JSON.parse(hwSpecsJson);
      } catch {
        parsedSpecs = { notes: hwSpecsJson };
      }

      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hwTitle,
          category: hwCategory,
          condition: hwCondition,
          campusLocation: hwLocation,
          maintenanceFee: parseFloat(hwMaintenance) || 0,
          securityDeposit: parseFloat(hwDeposit) || 0,
          description: hwDescription,
          specs: parsedSpecs,
          imageUrl:
            hwImageUrl ||
            'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list hardware');

      setSuccessMessage(data.message || 'Hardware listed successfully! +10 Trust Score added.');
      setTimeout(() => {
        router.push('/hardware');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error listing component');
    } finally {
      setSubmitting(false);
    }
  };

  // CAD Submit
  const handleCadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cadTitle,
          description: cadDescription,
          fileUrl: cadFileUrl,
          previewMeshUrl: cadFileUrl,
          fileFormat: cadFormat,
          softwareUsed: cadSoftware,
          materialRecommendation: cadMaterial,
          infillPercent: parseInt(cadInfill, 10) || 20,
          toleranceNotes: cadTolerance,
          licenseType: cadLicense,
          fileSize: '2.1 MB',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish CAD assembly');

      setSuccessMessage(data.message || 'CAD resource published! +15 Trust Score added.');
      setTimeout(() => {
        router.push('/cad-hub');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error publishing CAD package');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Campus Resource Contribution Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          List Hardware or Share CAD
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Every component listed and open CAD asset published advances your Campus Trust Score and powers peer engineering projects.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl max-w-md mx-auto font-mono text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('hardware');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'hardware'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Physical Hardware (+10 Pts)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cad');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'cad'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D CAD Model (+15 Pts)</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMessage} Redirecting...</span>
        </div>
      )}

      {/* TAB 1: HARDWARE FORM */}
      {activeTab === 'hardware' && (
        <form
          onSubmit={handleHardwareSubmit}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Hardware Component Details</h2>
              <p className="text-xs text-slate-400">
                Lend microcontrollers, sensors, actuators, or testbenches to peer students.
              </p>
            </div>
            <span className="px-3 py-1 bg-sky-950 text-sky-400 text-xs font-mono font-bold rounded-lg border border-sky-800">
              +10 Trust Score
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Component Name / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., STM32 Nucleo-F446RE Development Board"
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Category *
                </label>
                <select
                  value={hwCategory}
                  onChange={(e) => setHwCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="Embedded Boards">Embedded Boards (STM32, ESP32, Arduino)</option>
                  <option value="Sensors">Sensors (mmWave, IMU, LiDAR)</option>
                  <option value="Actuators/Motors">Actuators / Motors (NEMA 17, BLDC)</option>
                  <option value="Robotics Parts">Robotics Parts (ODrive, ESCs)</option>
                  <option value="Lab Tools">Lab Tools (Soldering, Multimeter, Scope)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Physical Condition *
                </label>
                <select
                  value={hwCondition}
                  onChange={(e) => setHwCondition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="NEW">New (Pristine / Unopened)</option>
                  <option value="GOOD">Good (Tested & Functional)</option>
                  <option value="FAIR">Fair (Cosmetic Wear / Functional)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Campus Pickup Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Central Library Maker Hub, Innovation Lab 3rd Floor"
                value={hwLocation}
                onChange={(e) => setHwLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Nominal Lab Maintenance Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={hwMaintenance}
                  onChange={(e) => setHwMaintenance(e.target.value)}
                  placeholder="0 for non-profit peer sharing"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  Set ₹0 for 100% free student lending.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Refundable Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={hwDeposit}
                  onChange={(e) => setHwDeposit(e.target.value)}
                  placeholder="0 (Trust-Score based)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  High Trust Score peers bypass this deposit automatically.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Component Description
              </label>
              <textarea
                rows={3}
                placeholder="Pinouts, included accessories (USB cable, anti-static bag), firmware status..."
                value={hwDescription}
                onChange={(e) => setHwDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Technical Specifications (JSON format)
              </label>
              <textarea
                rows={3}
                value={hwSpecsJson}
                onChange={(e) => setHwSpecsJson(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-sky-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={hwImageUrl}
                onChange={(e) => setHwImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Listing Component...
              </span>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Publish to Campus Hardware Pool (+10 Pts)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: CAD ASSET FORM */}
      {activeTab === 'cad' && (
        <form
          onSubmit={handleCadSubmit}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">CAD & 3D Assembly Details</h2>
              <p className="text-xs text-slate-400">
                Share open-source mechanical assemblies, printable housings, or cycloidal drives.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 text-xs font-mono font-bold rounded-lg border border-emerald-800">
              +15 Trust Score
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                CAD Package Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., High-Torque Cycloidal Reducer Gearbox (11:1)"
                value={cadTitle}
                onChange={(e) => setCadTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  File Format *
                </label>
                <select
                  value={cadFormat}
                  onChange={(e) => setCadFormat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="STL">STL (Mesh for 3D Slicers & WebGL)</option>
                  <option value="STEP">STEP (Standard for Exchange of Product Data)</option>
                  <option value="OBJ">OBJ (Wavefront 3D Object)</option>
                  <option value="SCRIPT">SCRIPT (OpenSCAD / Procedural Python)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  CAD Software Used *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SolidWorks 2024 / Autodesk Fusion 360"
                  value={cadSoftware}
                  onChange={(e) => setCadSoftware(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Recommended Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PETG / Carbon Fiber PLA / PEEK"
                  value={cadMaterial}
                  onChange={(e) => setCadMaterial(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  Recommended Infill (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={cadInfill}
                  onChange={(e) => setCadInfill(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  License Type
                </label>
                <select
                  value={cadLicense}
                  onChange={(e) => setCadLicense(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="CC-BY-SA 4.0">Creative Commons CC-BY-SA 4.0</option>
                  <option value="MIT License">MIT License (Open Source)</option>
                  <option value="CERN OHL-S v2">CERN Open Hardware Licence (Strongly Reciprocal)</option>
                  <option value="OSHW Compliant">Open Source Hardware Association (OSHW)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                  CAD File Sample / Endpoint
                </label>
                <select
                  value={cadFileUrl}
                  onChange={(e) => setCadFileUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="/cad-models/cycloidal-gearbox.stl">Cycloidal Gearbox Mesh (.STL)</option>
                  <option value="/cad-models/axial-flux-stator.stl">Axial Flux Stator Core (.STL)</option>
                  <option value="/cad-models/esp32-sensor-enclosure.stl">Snap-Fit Sensor Case (.STL)</option>
                  <option value="/cad-models/drone-gimbal-linkage.stl">Drone Gimbal Arm Linkage (.STL)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Tolerance & Slicing Notes
              </label>
              <input
                type="text"
                placeholder="e.g., 0.12mm clearance on pins; no support required."
                value={cadTolerance}
                onChange={(e) => setCadTolerance(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Assembly & Project Description
              </label>
              <textarea
                rows={3}
                placeholder="Engineering context, kinematics, bearing part numbers, bill of materials..."
                value={cadDescription}
                onChange={(e) => setCadDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Publishing 3D Asset...
              </span>
            ) : (
              <>
                <Box className="w-4 h-4" />
                <span>Publish to Campus CAD Hub (+15 Pts)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
