'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Calendar, CreditCard, ShoppingBag, RefreshCw } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function ReportsPage() {
  const [range, setRange] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range]);

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Reports</h1>
          <p className="text-sm text-slate-500">Daily, weekly and monthly sales overview</p>
        </div>
        <div className="flex gap-2 border border-slate-200 rounded-lg bg-white p-1">
          {['daily', 'weekly', 'monthly'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${range === r ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={report.totalOrders} icon={<FileText />} color="text-blue-600" />
        <StatCard label="Completed Orders" value={report.completedOrders} icon={<ShoppingBag />} color="text-emerald-600" />
        <StatCard label="Cancelled Orders" value={report.cancelledOrders} icon={<Calendar />} color="text-rose-600" />
        <StatCard label="Total Revenue" value={formatINR(report.totalRevenue)} icon={<CreditCard />} color="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Popular Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500">Item</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Qty Sold</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(report.popular || []).map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-600 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(item.revenue)}</td>
                    </tr>
                  ))}
                  {!report.popular || report.popular.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-slate-500">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Revenue</span>
                <span className="font-medium text-slate-900">{formatINR(report.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total GST Collected</span>
                <span className="font-medium text-slate-900">{formatINR(report.totalGST)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                <span className="text-slate-500">Grand Total</span>
                <span className="font-bold text-slate-900">{formatINR(report.totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Payment Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 font-medium text-slate-500">Table</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Payment</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Total</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">GST</th>
                <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 font-medium text-slate-500">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report.paymentReport || []).slice(0, 50).map((p) => (
                <tr key={p.orderNumber} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">#{p.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{p.tableNumber ? '#' + p.tableNumber : '–'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${p.status === 'READY' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : p.status === 'PENDING' ? 'border-amber-100 text-amber-700 bg-amber-50' : 'border-slate-100 text-slate-700 bg-slate-50'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${p.payment === 'PAID' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-rose-100 text-rose-700 bg-rose-50'}`}>{p.payment}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(p.total)}</td>
                  <td className="px-4 py-3 text-slate-600 text-right">{formatINR(p.gst)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-600">{p.paidBy || '–'}</td>
                </tr>
              ))}
              {!report.paymentReport || report.paymentReport.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-slate-500">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex justify-between mb-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <Icon className="h-4 w-4" style={{ color: 'currentColor' }} />
      </div>
      <p className={`text-2xl font-bold text-slate-900 ${color}`}>{value}</p>
    </div>
  );
}
