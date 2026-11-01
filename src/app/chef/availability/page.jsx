'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Utensils } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AvailabilityPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/foods');
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const toggleAvailability = async (id, current) => {
    try {
      const res = await fetch(`/api/foods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !current }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Marked ${!current ? 'available' : 'unavailable'}`);
      load();
    } catch (e) {
      toast.error('Failed to update availability');
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Food Availability</h1>
          <p className="text-sm text-slate-500">Mark items available/unavailable — the customer menu updates instantly</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Food Item</th>
                <th className="px-4 py-3 font-medium text-slate-500">Category</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Price</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {foods.length ? (
                foods.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                    <td className="px-4 py-3 text-slate-600">{f.category?.name || '–'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(f.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${f.isAvailable ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-rose-100 text-rose-700 bg-rose-50'}`}>
                        {f.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAvailability(f.id, f.isAvailable)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center gap-1.5"
                        style={{ background: f.isAvailable ? '#fecaca' : '#bfdbfe', color: f.isAvailable ? '#991b1b' : '#1e40af' }}
                      >
                        <Utensils className="h-3 w-3" />
                        {f.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="h-32 text-center text-slate-500">No food items found</td></tr>
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
