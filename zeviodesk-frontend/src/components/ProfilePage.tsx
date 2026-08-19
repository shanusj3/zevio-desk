import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, Shield, User, Building2, Info } from 'lucide-react';
import shieldGraph from '../assets/sheild_graph.png';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAppStore();

  if (!currentUser) return null;

  return (
    <div className="p-6 md:p-8 max-w-[900px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-[#94A3B8] text-sm">View your personal information and role details.</p>
      </div>

      <div className="bg-[#121721] rounded-2xl p-8 mb-8 border border-[#1e293b] flex justify-between items-center relative overflow-hidden">

        {/* Top-left subtle gradient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D99B26] opacity-[0.07] blur-[80px] pointer-events-none rounded-full" />

        {/* User Info */}
        <div className="flex items-center gap-6 z-10">
          <div className="relative">
            {/* Avatar concentric rings */}
            <div className="absolute inset-0 -m-2 rounded-full border border-white/5" />
            <div className="absolute inset-0 -m-4 rounded-full border border-[#D99B26]/10" />

            {/* Dots behind avatar */}
            <svg className="absolute -left-6 -bottom-6 w-12 h-12 opacity-10" fill="#ffffff" viewBox="0 0 20 20">
              <circle cx="2" cy="2" r="1" /> <circle cx="8" cy="2" r="1" /> <circle cx="14" cy="2" r="1" />
              <circle cx="2" cy="8" r="1" /> <circle cx="8" cy="8" r="1" /> <circle cx="14" cy="8" r="1" />
              <circle cx="2" cy="14" r="1" /> <circle cx="8" cy="14" r="1" /> <circle cx="14" cy="14" r="1" />
            </svg>

            <div className="relative w-24 h-24 rounded-full bg-[#D99B26] flex items-center justify-center text-3xl font-bold text-[#0d121c] shadow-[0_0_20px_rgba(217,155,38,0.15)]">
              {currentUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{currentUser.name}</h2>
            <div className="flex items-center gap-2 text-[#94A3B8] mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{currentUser.email}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D99B26]/10 text-[#D99B26] border border-[#D99B26]/20 font-semibold text-xs tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Shield Graphic */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[140%] w-auto pointer-events-none">
          <img src={shieldGraph} alt="Shield Graphic" className="h-full w-auto object-contain drop-shadow-2xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          <div className="bg-[#121721] rounded-xl p-5 border border-[#1e293b] flex items-center gap-4 hover:border-[#2a364a] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1e2532] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#D99B26]" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Full Name</p>
              <p className="text-sm font-semibold text-white">{currentUser.name}</p>
            </div>
          </div>

          <div className="bg-[#121721] rounded-xl p-5 border border-[#1e293b] flex items-center gap-4 hover:border-[#2a364a] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1e2532] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#D99B26]" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Email Address</p>
              <p className="text-sm font-semibold text-white">{currentUser.email}</p>
            </div>
          </div>

          <div className="bg-[#121721] rounded-xl p-5 border border-[#1e293b] flex items-center gap-4 hover:border-[#2a364a] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1e2532] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#D99B26]" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Access Level</p>
              <p className="text-sm font-semibold text-white">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          {currentUser.tenantId && (
            <div className="bg-[#121721] rounded-xl p-5 border border-[#1e293b] flex items-center gap-4 hover:border-[#2a364a] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#1e2532] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#D99B26]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-[#94A3B8] mb-1">Tenant ID</p>
                <p className="text-sm font-semibold text-white truncate">{currentUser.tenantId}</p>
              </div>
            </div>
          )}

        </div>

        <div className="bg-[#121721] rounded-xl p-4 border border-[#1e293b] flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#D99B26]/10 border border-[#D99B26]/20 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5 text-[#D99B26]" />
          </div>
          <p className="text-sm text-[#94A3B8]">
            Keep your profile information up to date to ensure smooth communication and account security.
          </p>
        </div>

      </div>
    </div>
  );
};
