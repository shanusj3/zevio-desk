import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usersApi } from '../lib/api';
import { Mail, Shield, User, Building2, Info, Lock, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, showToast } = useAppStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!currentUser) return null;

  const getInitials = (name: string) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.update(currentUser.id, { password: newPassword });
      showToast('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = getInitials(currentUser.name);

  return (
    <div className="p-4 md:p-8 max-w-[900px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-1 tracking-tight">Profile Information</h1>
        <p className="text-[#64748b] text-xs md:text-sm">
          View your personal account details and update your password.
        </p>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#dfe5eb] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Top-left subtle gradient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#116dff] opacity-[0.06] blur-[80px] pointer-events-none rounded-full" />

        {/* User Avatar & Info */}
        <div className="flex items-center gap-6 z-10">
          <div className="relative shrink-0">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#116dff] flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-[0_0_20px_rgba(17,109,255,0.25)] select-none">
              {initials}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-[#1e293b] mb-1 truncate">{currentUser.name}</h2>
            <div className="flex items-center gap-2 text-[#64748b] mb-3">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm truncate">{currentUser.email}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#116dff]/10 text-[#116dff] border border-[#116dff]/20 font-semibold text-xs tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#1e293b] tracking-tight">Account Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#116dff]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#64748b] mb-0.5">Full Name</p>
              <p className="text-sm font-semibold text-[#1e293b] truncate">{currentUser.name}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#116dff]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#64748b] mb-0.5">Email Address</p>
              <p className="text-sm font-semibold text-[#1e293b] truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#116dff]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#64748b] mb-0.5">Access Level</p>
              <p className="text-sm font-semibold text-[#1e293b]">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          {currentUser.tenantId && (
            <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#116dff]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#64748b] mb-0.5">Tenant ID</p>
                <p className="text-sm font-semibold text-[#1e293b] truncate">{currentUser.tenantId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Edit Section (Editable) */}
      <div className="bg-white rounded-2xl border border-[#dfe5eb] p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-[#f1f5f9]">
          <div className="w-10 h-10 rounded-full bg-[#116dff]/10 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#116dff]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e293b]">Security & Password</h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Update your account password. Name and email are managed by platform administrators.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
          {passwordError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1e293b]">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full h-10 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 pr-10 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1e293b]">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-10 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 pr-10 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#dfe5eb] flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-[#116dff]/10 border border-[#116dff]/20 flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5 text-[#116dff]" />
        </div>
        <p className="text-xs md:text-sm text-[#64748b]">
          Keep your profile information up to date and choose a strong password to ensure smooth communication and account security.
        </p>
      </div>
    </div>
  );
};
