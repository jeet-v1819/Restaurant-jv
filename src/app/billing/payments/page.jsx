'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, RefreshCw, CreditCard } from 'lucide-react';
import { formatINR, relativeTime } from '@/lib/utils';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (e) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>;

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
          <p className="text-sm text-slate-500">All cash payments recorded by billing staff</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Transactions</h3>
            <p className="text-xs text-slate-500">Cash payments only</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">Total Collected</p>
            <p className="text-xs font-bold text-brand">{formatINR(total)}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 font-medium text-slate-500">Table</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">GST</th>
                <th className="px-4 py-3 font-medium text-slate-500">Paid At</th>
                <th className="px-4 py-3 font-medium text-slate-500">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">#{p.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">#{p.order?.table?.tableNumber}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatINR(p.gstAmount)}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(p.paidAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.paidBy?.name || '–'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No payments recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
}
