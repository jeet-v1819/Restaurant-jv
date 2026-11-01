'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { User as UserIcon, Clock, ChevronRight, Search } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id, current) => {
    try {
      const res = await fetch('/api/customers', { method: 'PUT', body: JSON.stringify({ id, isActive: !current }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Customer ${!current ? 'activated' : 'deactivated'}`);
      load();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
        <p className="text-sm text-slate-500">View registered customers and their order history</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Search customers..." />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Customer</th>
                <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-500">Orders</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="h-32 flex items-center justify-center text-slate-500">Loading...</td></tr>
              ) : customers.length ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.user.phone || '–'}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{c._count?.orders || 0}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.id, c.user.isActive)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition ${c.user.isActive ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-slate-100 text-slate-700 bg-slate-50'}`}>
                        {c.user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={`/admin/customers/${c.id}`} className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="h-32 text-center text-slate-500">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
