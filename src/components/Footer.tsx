import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span className="font-extrabold text-white text-sm">CAMPUS-SHARE</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              A university non-profit hardware lending and open-source CAD repository. Built by engineering students to eliminate component bottlenecks, accelerate capstone projects, and minimize electronic waste.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Trust Protocol Enabled</span>
            </div>
          </div>

          {/* Col 2: Hardware Categories */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Hardware Categories</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/hardware?category=Embedded%20Boards" className="hover:text-sky-400 transition">Embedded & MCU Boards (STM32, ESP32)</Link></li>
              <li><Link href="/hardware?category=Sensors" className="hover:text-sky-400 transition">Sensors (mmWave, IMUs, LiDAR)</Link></li>
              <li><Link href="/hardware?category=Actuators%2FMotors" className="hover:text-sky-400 transition">Actuators, BLDC & Stepper Motors</Link></li>
              <li><Link href="/hardware?category=Robotics%20Parts" className="hover:text-sky-400 transition">ODrive & Robotic Motor Controllers</Link></li>
              <li><Link href="/hardware?category=Lab%20Tools" className="hover:text-sky-400 transition">Lab Tools (Soldering, Rigol Scopes)</Link></li>
            </ul>
          </div>

          {/* Col 3: CAD & Engineering Assets */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">CAD & 3D Repository</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/cad-hub" className="hover:text-sky-400 transition">Interactive 3D WebGL Viewer</Link></li>
              <li><Link href="/cad-hub?format=STL" className="hover:text-sky-400 transition">3D Printable Meshes (.STL)</Link></li>
              <li><Link href="/cad-hub?format=STEP" className="hover:text-sky-400 transition">Parametric Assemblies (.STEP)</Link></li>
              <li><Link href="/upload" className="hover:text-sky-400 transition">Share CAD Assets (+15 Trust Points)</Link></li>
            </ul>
          </div>

          {/* Col 4: Sustainability & Campus Stats */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Campus Impact</h4>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">E-Waste Prevented:</span>
                <span className="font-bold text-emerald-400">~42 kg Components</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student Projects Empowered:</span>
                <span className="font-bold text-sky-400">120+ Teams</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Open Source License:</span>
                <span className="font-bold text-slate-200">OSHW / CC-BY-SA 4.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Campus-Share • Non-Profit University Engineering Platform</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              Verified .edu / .ac.in Gatekeeper
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
