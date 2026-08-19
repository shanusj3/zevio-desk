import React from 'react';
import {
  Store, ShieldCheck, Pause, Users, Info, FileText,
  Ticket as TicketIcon, CheckCircle, Clock, Wrench,
  Package, AlertCircle, PhoneCall, TrendingUp
} from 'lucide-react';

type StatCardType =
  // Super Admin
  | 'totalTenants' | 'activeTenants' | 'inactiveTenants' | 'totalUsers'
  // Admin / Tenant Admin / Shop Admin
  | 'totalTickets' | 'openTickets' | 'inProgressTickets' | 'resolvedTickets'
  | 'waitingParts' | 'readyPickup' | 'deliveredToday' | 'overdue'
  // Technician — "My Work"
  | 'tech_newReceived' | 'tech_diagnosing' | 'tech_waitingParts' | 'tech_inProgress' | 'tech_deliveredToday'
  // Advisor — "Need Attention"
  | 'adv_newReceived' | 'adv_readyPickup' | 'adv_deliveredToday';

interface StatCardProps {
  type: StatCardType;
  value: string | number;
}

const configs: Record<StatCardType, {
  title: string;
  caption: string;
  bgGradient: string;
  badgeBg: string;
  badgeIcon: React.ElementType;
  badgeColor: string;
}> = {
  // ── Super Admin ──────────────────────────────────────────────────────
  totalTenants: {
    title: 'Total Tenants', caption: 'All tenants in the platform',
    bgGradient: 'bg-gradient-to-br from-[#271C5E] via-[#1F154D] to-[#140D36] border-[#4F36AA]/50',
    badgeBg: 'bg-[#3C278F]', badgeIcon: Store, badgeColor: 'text-[#C7D2FE]',
  },
  activeTenants: {
    title: 'Active Tenants', caption: 'Currently active tenants',
    bgGradient: 'bg-gradient-to-br from-[#0D4B43] via-[#093933] to-[#052622] border-[#168173]/50',
    badgeBg: 'bg-[#126458]', badgeIcon: ShieldCheck, badgeColor: 'text-[#99F6E4]',
  },
  inactiveTenants: {
    title: 'Inactive Tenants', caption: 'Suspended or inactive tenants',
    bgGradient: 'bg-gradient-to-br from-[#532507] via-[#3E1A04] to-[#2B1002] border-[#934511]/50',
    badgeBg: 'bg-[#70330B]', badgeIcon: Pause, badgeColor: 'text-[#FFEDD5]',
  },
  totalUsers: {
    title: 'Total Users', caption: 'All users across tenants',
    bgGradient: 'bg-gradient-to-br from-[#4A133A] via-[#350B28] to-[#24061B] border-[#862266]/50',
    badgeBg: 'bg-[#63184C]', badgeIcon: Users, badgeColor: 'text-[#FBCFE8]',
  },

  // ── Admin / Shop Overview ────────────────────────────────────────────
  totalTickets: {
    title: 'Total Open', caption: 'All active tickets in shop',
    bgGradient: 'bg-gradient-to-br from-[#271C5E] via-[#1F154D] to-[#140D36] border-[#4F36AA]/50',
    badgeBg: 'bg-[#3C278F]', badgeIcon: FileText, badgeColor: 'text-[#C7D2FE]',
  },
  openTickets: {
    title: 'New Arrivals', caption: 'Received & awaiting diagnosis',
    bgGradient: 'bg-gradient-to-br from-[#0B3A60] via-[#072B47] to-[#041B2D] border-[#13609D]/50',
    badgeBg: 'bg-[#124C7B]', badgeIcon: TicketIcon, badgeColor: 'text-[#93C5FD]',
  },
  inProgressTickets: {
    title: 'Repair in Progress', caption: 'Actively being repaired',
    bgGradient: 'bg-gradient-to-br from-[#532507] via-[#3E1A04] to-[#2B1002] border-[#934511]/50',
    badgeBg: 'bg-[#70330B]', badgeIcon: Wrench, badgeColor: 'text-[#FFEDD5]',
  },
  resolvedTickets: {
    title: 'Delivered Today', caption: 'Completed & handed over today',
    bgGradient: 'bg-gradient-to-br from-[#0D4B43] via-[#093933] to-[#052622] border-[#168173]/50',
    badgeBg: 'bg-[#126458]', badgeIcon: CheckCircle, badgeColor: 'text-[#99F6E4]',
  },
  waitingParts: {
    title: 'Waiting for Parts', caption: 'Paused — parts on order',
    bgGradient: 'bg-gradient-to-br from-[#4A2D07] via-[#36200A] to-[#24150A] border-[#8C5A14]/50',
    badgeBg: 'bg-[#6B4110]', badgeIcon: Package, badgeColor: 'text-[#FDE68A]',
  },
  readyPickup: {
    title: 'Ready for Pickup', caption: 'Waiting for customer collection',
    bgGradient: 'bg-gradient-to-br from-[#0D3B48] via-[#092B38] to-[#051C24] border-[#147090]/50',
    badgeBg: 'bg-[#0F5370]', badgeIcon: PhoneCall, badgeColor: 'text-[#67E8F9]',
  },
  deliveredToday: {
    title: 'Delivered Today', caption: 'Completed & handed over today',
    bgGradient: 'bg-gradient-to-br from-[#0D4B43] via-[#093933] to-[#052622] border-[#168173]/50',
    badgeBg: 'bg-[#126458]', badgeIcon: TrendingUp, badgeColor: 'text-[#99F6E4]',
  },
  overdue: {
    title: 'Overdue', caption: 'Past estimated completion date',
    bgGradient: 'bg-gradient-to-br from-[#4A0808] via-[#350606] to-[#240404] border-[#8C1414]/50',
    badgeBg: 'bg-[#6B0E0E]', badgeIcon: AlertCircle, badgeColor: 'text-[#FCA5A5]',
  },

  // ── Technician — "My Work" ───────────────────────────────────────────
  tech_newReceived: {
    title: 'To Review', caption: 'Newly assigned tickets',
    bgGradient: 'bg-gradient-to-br from-[#0B3A60] via-[#072B47] to-[#041B2D] border-[#13609D]/50',
    badgeBg: 'bg-[#124C7B]', badgeIcon: TicketIcon, badgeColor: 'text-[#93C5FD]',
  },
  tech_diagnosing: {
    title: 'Diagnosis', caption: 'Under investigation',
    bgGradient: 'bg-gradient-to-br from-[#271C5E] via-[#1F154D] to-[#140D36] border-[#4F36AA]/50',
    badgeBg: 'bg-[#3C278F]', badgeIcon: Clock, badgeColor: 'text-[#C7D2FE]',
  },
  tech_waitingParts: {
    title: 'Waiting for Parts', caption: 'On hold — parts ordered',
    bgGradient: 'bg-gradient-to-br from-[#4A2D07] via-[#36200A] to-[#24150A] border-[#8C5A14]/50',
    badgeBg: 'bg-[#6B4110]', badgeIcon: Package, badgeColor: 'text-[#FDE68A]',
  },
  tech_inProgress: {
    title: 'Repair in Progress', caption: 'Actively working on',
    bgGradient: 'bg-gradient-to-br from-[#532507] via-[#3E1A04] to-[#2B1002] border-[#934511]/50',
    badgeBg: 'bg-[#70330B]', badgeIcon: Wrench, badgeColor: 'text-[#FFEDD5]',
  },
  tech_deliveredToday: {
    title: 'Delivered Today', caption: 'Jobs completed today',
    bgGradient: 'bg-gradient-to-br from-[#0D4B43] via-[#093933] to-[#052622] border-[#168173]/50',
    badgeBg: 'bg-[#126458]', badgeIcon: CheckCircle, badgeColor: 'text-[#99F6E4]',
  },

  // ── Advisor — "Need Attention" ───────────────────────────────────────
  adv_newReceived: {
    title: 'New', caption: 'New arrivals to process',
    bgGradient: 'bg-gradient-to-br from-[#0B3A60] via-[#072B47] to-[#041B2D] border-[#13609D]/50',
    badgeBg: 'bg-[#124C7B]', badgeIcon: TicketIcon, badgeColor: 'text-[#93C5FD]',
  },
  adv_readyPickup: {
    title: 'Ready for Pickup', caption: 'Customers need to be notified',
    bgGradient: 'bg-gradient-to-br from-[#0D3B48] via-[#092B38] to-[#051C24] border-[#147090]/50',
    badgeBg: 'bg-[#0F5370]', badgeIcon: PhoneCall, badgeColor: 'text-[#67E8F9]',
  },
  adv_deliveredToday: {
    title: 'Delivered Today', caption: 'Handed over to customers today',
    bgGradient: 'bg-gradient-to-br from-[#0D4B43] via-[#093933] to-[#052622] border-[#168173]/50',
    badgeBg: 'bg-[#126458]', badgeIcon: CheckCircle, badgeColor: 'text-[#99F6E4]',
  },
};

export const StatCard: React.FC<StatCardProps> = ({ type, value }) => {
  const config = configs[type];
  const Icon = config.badgeIcon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 border shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${config.bgGradient}`}
    >
      <div className="relative z-10 flex items-center gap-3.5">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.badgeBg} ${config.badgeColor} shadow-inner`}
        >
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px] font-medium tracking-wide">
            <span>{config.title}</span>
            <Info className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <p className="text-[11px] text-[#94A3B8]/80 mt-0.5 font-normal truncate">
            {config.caption}
          </p>
        </div>
      </div>
    </div>
  );
};
