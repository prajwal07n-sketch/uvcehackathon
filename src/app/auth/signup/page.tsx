'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building,
} from 'lucide-react';
import {
  isAcademicEmail,
  extractInstitutionFromEmail,
  getAcademicDomain,
} from '@/lib/validators/academicEmail';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [department, setDepartment] = useState('Electronics & Communication');
  const [semester, setSemester] = useState('6');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Universal Academic Domain Verification
  const isEmailValidAcademic = isAcademicEmail(email);
  const detectedInstitution = email ? extractInstitutionFromEmail(email) : '';
  const detectedDomain = email ? getAcademicDomain(email) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEmailValidAcademic) {
      setErrorMessage(
        'Please enter a valid email address.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          usn: usn.trim().toUpperCase(),
          department,
          semester: parseInt(semester, 10),
          phone: phone.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMessage(
        'Academic account created and verified! Automatically signing in...'
      );

      // Auto sign in with credentials
      const signInRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (signInRes?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/auth/signin?registered=true');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Universal Academic Community Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Academic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Join the inter-campus hardware exchange & CAD repository. Open to all students & researchers with an accredited academic email.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-rose-950/30">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-emerald-950/30">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-xs text-emerald-300/90 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            {/* Academic Email with Live Badge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300 uppercase">
                  Academic Email Address *
                </label>
                {email && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                      isEmailValidAcademic
                        ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950/90 text-rose-400 border-rose-800'
                    }`}
                  >
                    {isEmailValidAcademic
                      ? `✓ Verified Academic Domain (${detectedDomain || detectedInstitution})`
                      : '✗ Needs @*.edu.in, @*.ac.in, @*.edu'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g., student@college.edu.in or name@institute.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              {isEmailValidAcademic && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>Detected Institution:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 font-bold uppercase tracking-wider text-emerald-300">
                    {detectedInstitution}
                  </span>
                </div>
              )}
            </div>

            {/* USN / Roll Number & Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  University Roll / USN *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., 1UV22EC012, DRAIT-042"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Current Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                  <option value="4">4th Semester</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                  <option value="9">Postgrad / Research</option>
                </select>
              </div>
            </div>

            {/* Department & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Engineering Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                  <option value="Electrical & Electronics">Electrical & Electronics (EEE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Computer Science & Engg">Computer Science & Engg (CSE)</option>
                  <option value="Information Science">Information Science (ISE)</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Robotics & Automation">Robotics & Automation</option>
                  <option value="Aerospace Engineering">Aerospace Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Platform Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="STUDENT">Student / Project Team</option>
                  <option value="LAB_ADMIN">Department Lab Coordinator</option>
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Contact Phone / WhatsApp (For Handover Coordination)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Security Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Must be at least 6 characters. Instant activation upon creation.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isEmailValidAcademic}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-sky-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-sky-950/60 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Registering Academic Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Register & Join Campus Network</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Already registered with an academic account?{' '}
              <Link
                href="/auth/signin"
                className="text-sky-400 hover:text-sky-300 font-mono font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
