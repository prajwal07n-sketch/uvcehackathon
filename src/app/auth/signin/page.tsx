'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Cpu,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Zap,
  Terminal,
  Building,
  CheckCircle2,
} from 'lucide-react';
import {
  isAcademicEmail,
  isStrictAcademicEmail,
  extractInstitutionFromEmail,
  getAcademicDomain,
} from '@/lib/validators/academicEmail';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');
  const isLoggedOut = searchParams.get('loggedOut') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'OAuthSignin' || urlError === 'OAuthCallback'
      ? 'Sign-in failed. Please verify your email address.'
      : null
  );

  const isEmailValid = isAcademicEmail(email);
  const isStrictAcademic = isStrictAcademicEmail(email);
  const detectedInstitution = email ? extractInstitutionFromEmail(email) : '';
  const detectedDomain = email ? getAcademicDomain(email) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res?.ok) {
        throw new Error(res?.error || 'Authentication error. Please verify your password.');
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('campus123');
    setLoading(true);
    setErrorMessage(null);

    const res = await signIn('credentials', {
      email: demoEmail,
      password: 'campus123',
      redirect: false,
      callbackUrl,
    });

    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setErrorMessage(res?.error || 'Demo login failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setErrorMessage('Failed to initiate Google Authentication');
      setOauthLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Sign In
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter any academic or personal email to access your campus hardware commons.
        </p>
      </div>

      {/* Success Logout Banner */}
      {isLoggedOut && !errorMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-emerald-950/30 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div>
            <p className="font-semibold">Signed Out Successfully</p>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              You have been signed out cleanly. You can now sign in with another academic ID or email.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-rose-950/30">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">Sign-In Note</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={oauthLoading || loading}
        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-2xl text-xs sm:text-sm font-mono font-medium text-slate-200 hover:text-white transition flex items-center justify-center gap-3 shadow-md shadow-black/30 hover:border-slate-600 disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google Account</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full"></div>
        <span className="bg-slate-950 px-3 text-[10px] font-mono text-slate-500 uppercase">
          Or sign in with password
        </span>
        <div className="border-t border-slate-800 w-full"></div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">
              Email Address
            </label>
            {email && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                  isEmailValid
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                {isEmailValid
                  ? isStrictAcademic
                    ? `✓ Verified Academic (${detectedDomain})`
                    : `✓ Verified Student Email (${detectedDomain})`
                  : '✗ Invalid Email Format'}
              </span>
            )}
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="e.g., your.name@gmail.com or student@college.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          {email && isEmailValid && (
            <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>Affiliation:</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/70 border border-emerald-800/80 font-bold uppercase tracking-wider text-emerald-300">
                  {detectedInstitution}
                </span>
              </div>
              <span className="text-[10px] text-sky-400 font-medium">✓ Immediate Activation</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">
              Password
            </label>
            <span className="text-[11px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer">
              Any password (e.g., campus123)
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        {/* Frictionless Login Info */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <p className="flex items-center gap-1 text-sky-400 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Instant Sign-In & Automatic Activation
          </p>
          <p className="text-slate-400 leading-relaxed">
            You can sign in with your own email directly. If your email is new, a verified student profile is generated automatically without waiting!
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-sky-950/60 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Signing in...
            </span>
          ) : (
            <>
              <span>Sign In to Campus-Share</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Logins Box */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1-Click Quick Demo Sign-In:
          </span>
          <span className="text-[10px] text-slate-500 font-mono">password: campus123</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('aarav.sharma@campus.edu')}
            className="p-2 text-left bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition text-slate-300 hover:text-white"
          >
            <p className="font-bold text-sky-400">Aarav (Student)</p>
            <p className="text-[10px] text-slate-500">ECE • 140 Trust Pts</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('labadmin.ece@campus.ac.in')}
            className="p-2 text-left bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition text-slate-300 hover:text-white"
          >
            <p className="font-bold text-purple-400">Dr. Venkatesh</p>
            <p className="text-[10px] text-slate-500">Lab Coordinator</p>
          </button>
        </div>
      </div>

      {/* Footer Link */}
      <div className="text-center pt-2 text-xs font-mono text-slate-400">
        Prefer custom profile details?{' '}
        <Link
          href="/auth/signup"
          className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4"
        >
          Create Full Profile with Roll/USN →
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
      {/* LEFT COLUMN: BRANDING, STATS & MISSION STATEMENT */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/70 border-r border-slate-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-lg shadow-sky-950/80">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">
                CAMPUS<span className="text-sky-400">-SHARE</span>
              </span>
              <span className="block text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                Universal Academic Hardware Commons
              </span>
            </div>
          </Link>

          <div className="pt-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Universal Email Authentication
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              An Open Hardware & CAD Commons for University Engineers.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Sign in with your email to reserve microcontrollers, borrow lab equipment, and inspect CAD 3D models.
            </p>
          </div>
        </div>

        {/* Live Platform Telemetry */}
        <div className="relative z-10 space-y-3 pt-8">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Active Hardware</span>
              <span className="text-xl font-bold text-sky-400 mt-0.5 block">7 Available</span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Open CAD Models</span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5 block">4 Meshes</span>
            </div>
          </div>
          <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            Automatic profile creation & immediate activation
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: SIGN-IN FORM */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md p-8 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse space-y-4">
              <div className="h-6 w-36 bg-slate-800 rounded"></div>
              <div className="h-10 bg-slate-800 rounded-xl"></div>
              <div className="h-10 bg-slate-800 rounded-xl"></div>
            </div>
          }
        >
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
