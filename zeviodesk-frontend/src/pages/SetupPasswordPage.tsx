import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, Lock } from 'lucide-react';
import { authApi } from '../lib/api';

interface SetupPasswordPageProps {
  token: string;
}

type TokenStatus = 'checking' | 'valid' | 'already_used' | 'expired' | 'invalid';

export const SetupPasswordPage: React.FC<SetupPasswordPageProps> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking');

  // Verify token on page load — before showing the form
  useEffect(() => {
    let cancelled = false;
    authApi
      .verifySetupToken(token)
      .then((res) => {
        if (cancelled) return;
        if (res.valid) {
          setTokenStatus('valid');
        } else {
          setTokenStatus((res.reason as TokenStatus) || 'invalid');
        }
      })
      .catch(() => {
        if (!cancelled) setTokenStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.setupPassword(token, password);

      const currentHostname = window.location.hostname;
      const parts = currentHostname.split('.');
      const tenantSlug = parts.length >= 2 ? parts[0] : null;

      let loginUrl = '/';
      if (tenantSlug) {
        const url = new URL(window.location.href);
        url.pathname = '/';
        url.search = '';
        loginUrl = url.toString();
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to setup password. The link might be expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Checking token ─────────────────────────────────────────────────────────
  if (tokenStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#116dff]" />
          <p className="text-slate-500 text-xs font-semibold">Verifying your invitation link...</p>
        </div>
      </div>
    );
  }

  // ── Already used — tenant is now active ────────────────────────────────────
  if (tokenStatus === 'already_used') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
        <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Link Already Used</h2>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            This invitation link has already been used to activate your account. Your account is{' '}
            <span className="text-emerald-600 font-bold">active</span>.
          </p>
          <a
            href="/"
            className="w-full h-11 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center cursor-pointer"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // ── Expired token ──────────────────────────────────────────────────────────
  if (tokenStatus === 'expired') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
        <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <LinkIcon className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Link Expired</h2>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            This invitation link has expired. Invitation links are valid for <span className="text-[#0f172a] font-bold">48 hours</span>.
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold text-left flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please contact your super admin to resend your invitation email.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
        <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Invalid Link</h2>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            This invitation link is invalid or does not exist. Please check the link or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
        <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Password Set!</h2>
          <p className="text-slate-500 text-xs font-medium">
            Your account is now fully active. Redirecting you to login...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[#116dff] mx-auto" />
        </div>
      </div>
    );
  }

  // ── Setup form (token is valid and unused) ─────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 font-sans text-[#1e293b]">
      {/* Clean Minimal White Form Card Centered */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 relative z-10 space-y-6">

        {/* Centered Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 flex items-center justify-center mb-4">
            <img src="/zeviodesk-logo-brand.png" alt="ZevioDesk Logo" className="h-14 lg:h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Setup Password</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Please set a password to activate your account
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full h-11 bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl pl-11 pr-11 text-xs font-semibold text-[#0f172a] placeholder:text-slate-400 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full h-11 bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl pl-11 pr-4 text-xs font-semibold text-[#0f172a] placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full h-11 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Setting Password...</span>
              </div>
            ) : (
              <span>Set Password & Activate</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
