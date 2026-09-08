import { FormEvent, useState } from 'react';
import { request } from '../lib/api';

type PublicTicket = {
  ticketNumber: string;
  status: string;
  device: string;
  estimatedCompletion: string | null;
  totalAmount: string | null;
};

export function PublicTrackingPage({ tenantSlug }: { tenantSlug: string }) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function track(event: FormEvent) {
    event.preventDefault();
    setError('');
    setTicket(null);
    setLoading(true);
    try {
      setTicket(await request<PublicTicket>(`/public/${encodeURIComponent(tenantSlug)}/tickets/${encodeURIComponent(ticketNumber.trim())}`));
    } catch (err: any) {
      setError(err.message || 'We could not find that repair.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-[#0c1017] text-white flex items-center justify-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-[#25334b] bg-[#101622] p-8 shadow-2xl">
      <p className="text-sm text-[#D99B26] font-semibold">Zeviodesk</p>
      <h1 className="mt-2 text-2xl font-bold">Track Your Repair</h1>
      <p className="mt-2 text-sm text-[#94A3B8]">Enter the ticket number provided by your repair shop.</p>
      <form className="mt-6 space-y-4" onSubmit={track}>
        <label className="block text-sm font-medium">Ticket Number
          <input required value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} placeholder="TK-0001" className="mt-2 w-full rounded-xl border border-[#31415e] bg-[#0c1017] px-4 py-3 text-white outline-none focus:border-[#D99B26]" />
        </label>
        <button disabled={loading} className="w-full rounded-xl bg-[#D99B26] px-4 py-3 font-semibold text-[#17120a] disabled:opacity-60">{loading ? 'Tracking…' : 'Track Repair'}</button>
      </form>
      {error && <p className="mt-5 text-sm text-red-400">{error}</p>}
      {ticket && <div className="mt-6 rounded-xl border border-[#31415e] p-4 text-sm space-y-2">
        <p><span className="text-[#94A3B8]">Ticket:</span> {ticket.ticketNumber}</p>
        <p><span className="text-[#94A3B8]">Status:</span> {ticket.status}</p>
        <p><span className="text-[#94A3B8]">Device:</span> {ticket.device}</p>
        {ticket.estimatedCompletion && <p><span className="text-[#94A3B8]">Estimated completion:</span> {new Date(ticket.estimatedCompletion).toLocaleDateString()}</p>}
      </div>}
    </section>
  </main>;
}
