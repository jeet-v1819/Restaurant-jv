'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, ShoppingCart, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatINR, relativeTime } from '@/lib/utils';

export default function CustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setCustomer(data); setLoading(false); })
      .catch(() => { toast.error('Failed to load customer'); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="h-64 flex items-center justify-center"><Loading className="h-6 w-6 animate-spin" /></div>;
  if (!customer) return <div className="py-10 text-center text-slate-500">Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/customers" className="text-slate-500 hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <span className="text-xs text-slate-400">/</span>
        <h1 className="text-xl font-bold text-slate-900">{customer.user.name}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Name" value={customer.user.name} />
        <InfoCard label="Email" value={customer.user.email} />
        <InfoCard label="Phone" value={customer.user.phone || '–'} />
        <InfoCard label="Total Orders" value={customer._count?.orders || 0} icon={<ShoppingCart />} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 font-medium text-slate-500">Table</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Total</th>
                <th className="px-4 py-3 font-medium text-slate-500">Payment</th>
                <th className="px-4 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(customer.orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">#{o.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">#{o.table?.tableNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${o.status === 'READY' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : o.status === 'PENDING' ? 'border-amber-100 text-amber-700 bg-amber-50' : 'border-slate-100 text-slate-700 bg-slate-50'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatINR(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-slate-600">{o.payment?.status || 'UNPAID'}</td>
                  <td className="px-4 py-3 text-slate-500">{relativeTime(o.createdAt)}</td>
                </tr>
              ))}
              {!customer.orders || customer.orders.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-slate-500">No orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Loading() {
  return <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
}
