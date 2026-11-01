'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { formatINR, relativeTime } from '@/lib/utils';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Order ID</th>
                <th className="px-4 py-3 font-medium text-slate-500">Table</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Total</th>
                <th className="px-4 py-3 font-medium text-slate-500">Payment</th>
                <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">#{o.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">#{o.table?.tableNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${o.status === 'READY' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : o.status === 'PENDING' ? 'border-amber-100 text-amber-700 bg-amber-50' : o.status === 'CANCELLED' || o.status === 'REJECTED' ? 'border-rose-100 text-rose-700 bg-rose-50' : 'border-blue-100 text-blue-700 bg-blue-50'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{o.payment?.status || 'UNPAID'}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/orders/${o.id}/track`} className="text-sm font-medium text-brand hover:underline">Track</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No orders yet</td></tr>
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
