import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Shield, Link as LinkIcon } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#D99B26]" />
          <p className="text-[#94A3B8] text-sm">Verifying your invitation link...</p>
        </div>
      </div>
    );
  }

  // ── Already used — tenant is now active ────────────────────────────────────
  if (tokenStatus === 'already_used') {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#D99B26]/10 via-transparent to-transparent opacity-40 blur-[100px] -z-10" />
        <div className="w-full max-w-md bg-[#101622] rounded-2xl border border-[#1b2536] shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#0e1c14] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#1e3a2a]">
            <CheckCircle2 className="w-8 h-8 text-[#34D399]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Link Already Used</h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
            This invitation link has already been used to activate your account. Your account is{' '}
            <span className="text-[#34D399] font-semibold">active</span>.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D99B26] hover:bg-[#F59E0B] text-[#0d121c] font-bold rounded-xl transition-all text-sm shadow-lg shadow-[#D99B26]/20"
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
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-red-900/10 via-transparent to-transparent opacity-40 blur-[100px] -z-10" />
        <div className="w-full max-w-md bg-[#101622] rounded-2xl border border-[#3a1f1f] shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#1a1010] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#4a2a2a]">
            <LinkIcon className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
            This invitation link has expired. Links are valid for <span className="text-white font-semibold">48 hours</span> after being sent.
          </p>
          <div className="flex items-center gap-2 p-3 bg-[#7F1D1D]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please contact your super admin to send a new invitation email.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-red-900/10 via-transparent to-transparent opacity-40 blur-[100px] -z-10" />
        <div className="w-full max-w-md bg-[#101622] rounded-2xl border border-[#3a1f1f] shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#1a1010] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#4a2a2a]">
            <AlertCircle className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed">
            This invitation link is invalid or does not exist. Please check the link or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#101622] rounded-2xl border border-[#1b2536] shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#22314a]">
            <CheckCircle2 className="w-8 h-8 text-[#34D399]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Set!</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Your account is now fully active. Redirecting you to login...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[#D99B26] mx-auto" />
        </div>
      </div>
    );
  }

  // ── Setup form (token is valid and unused) ─────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#D99B26]/10 via-transparent to-transparent opacity-50 blur-[100px] -z-10" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-tr from-[#D99B26] to-[#F59E0B] shadow-[0_0_40px_rgba(217,155,38,0.3)] mb-6">
            <Shield className="w-8 h-8 text-[#0d121c]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Setup Password</h1>
          <p className="text-[#64748B] text-sm mt-2 font-medium">
            Please set a strong password to activate your admin account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#101622] rounded-2xl border border-[#1b2536] shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="space-y-5 relative z-10">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#7F1D1D]/10 border border-[#EF4444]/20 rounded-lg text-xs font-medium text-[#EF4444] animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-[#162030] border border-[#23314a] rounded-xl px-4 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#D99B26] focus:ring-1 focus:ring-[#D99B26]/50 transition-all font-mono"
                  placeholder="Min 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 bg-[#162030] border border-[#23314a] rounded-xl px-4 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#D99B26] focus:ring-1 focus:ring-[#D99B26]/50 transition-all font-mono"
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-12 mt-6 bg-[#D99B26] hover:bg-[#F59E0B] text-[#0d121c] font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#D99B26]/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Set Password &amp; Activate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
