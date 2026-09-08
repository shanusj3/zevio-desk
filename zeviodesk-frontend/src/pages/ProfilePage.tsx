import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, Shield, User, Building2, Info } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAppStore();

  if (!currentUser) return null;

  return (
    <div className="p-6 md:p-8 max-w-[900px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e293b] mb-1">My Profile</h1>
        <p className="text-[#64748b] text-sm">View your personal information and role details.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 mb-8 border border-[#dfe5eb] shadow-xs flex justify-between items-center relative overflow-hidden">
        {/* Top-left subtle gradient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#116dff] opacity-[0.05] blur-[80px] pointer-events-none rounded-full" />

        {/* User Info */}
        <div className="flex items-center gap-6 z-10">
          <div className="relative">
            {/* Avatar concentric rings */}
            <div className="absolute inset-0 -m-2 rounded-full border border-black/5" />
            <div className="absolute inset-0 -m-4 rounded-full border border-[#116dff]/10" />

            {/* Dots behind avatar */}
            <svg className="absolute -left-6 -bottom-6 w-12 h-12 opacity-10" fill="#116dff" viewBox="0 0 20 20">
              <circle cx="2" cy="2" r="1" /> <circle cx="8" cy="2" r="1" /> <circle cx="14" cy="2" r="1" />
              <circle cx="2" cy="8" r="1" /> <circle cx="8" cy="8" r="1" /> <circle cx="14" cy="8" r="1" />
              <circle cx="2" cy="14" r="1" /> <circle cx="8" cy="14" r="1" /> <circle cx="14" cy="14" r="1" />
            </svg>

            <div className="relative w-24 h-24 rounded-full bg-[#116dff] flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(17,109,255,0.25)]">
              {currentUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b] mb-2">{currentUser.name}</h2>
            <div className="flex items-center gap-2 text-[#64748b] mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{currentUser.email}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#116dff]/10 text-[#116dff] border border-[#116dff]/20 font-semibold text-xs tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-4">Account Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#116dff]" />
            </div>
            <div>
              <p className="text-xs text-[#64748b] mb-1">Full Name</p>
              <p className="text-sm font-semibold text-[#1e293b]">{currentUser.name}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#116dff]" />
            </div>
            <div>
              <p className="text-xs text-[#64748b] mb-1">Email Address</p>
              <p className="text-sm font-semibold text-[#1e293b]">{currentUser.email}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#116dff]" />
            </div>
            <div>
              <p className="text-xs text-[#64748b] mb-1">Access Level</p>
              <p className="text-sm font-semibold text-[#1e293b]">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          {currentUser.tenantId && (
            <div className="bg-white rounded-xl p-5 border border-[#dfe5eb] shadow-xs flex items-center gap-4 hover:border-[#cbd5e1] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#116dff]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-[#64748b] mb-1">Tenant ID</p>
                <p className="text-sm font-semibold text-[#1e293b] truncate">{currentUser.tenantId}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#dfe5eb] flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#116dff]/10 border border-[#116dff]/20 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5 text-[#116dff]" />
          </div>
          <p className="text-sm text-[#64748b]">
            Keep your profile information up to date to ensure smooth communication and account security.
          </p>
        </div>
      </div>
    </div>
  );
};

