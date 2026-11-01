'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  DollarSign,
  Clock,
  ShoppingCart,
  X as XIcon,
  Table as TableIcon,
  Users,
  AlertCircle,
  Activity,
  Bell,
  CheckCircle2,
  RefreshCw,
  Utensils,
  Settings,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { useRealTime } from '@/hooks/use-real-time';

const STATS = [
  { label: 'Total Orders', key: 'totalOrders', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: "Today's Orders", key: 'todayOrders', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Pending Orders', key: 'pendingOrders', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Completed Orders', key: 'completedOrders', icon: CheckIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: "Today's Revenue", key: 'todayRevenue', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Revenue', key: 'totalRevenue', icon: DollarSign, color: 'text-slate-700', bg: 'bg-slate-100' },
  { label: 'Available Tables', key: 'availableTables', icon: TableIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Occupied Tables', key: 'occupiedTables', icon: TableIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
];

function CheckIcon() {
  return <CheckCircle2 className="h-5 w-5" />;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const { refetch } = useRealTime({
    channels: ['admin'],
    onEvent: (event, data) => {
      if (event === 'order_created') {
        setRecent((prev) => [data.order, ...prev].slice(0, 8));
        refetchStats();
      }
      if (event === 'payment_paid') refetchStats();
      if (event === 'table_status_changed') refetchStats();
    },
  });

  const refetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, oRes, wRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/orders?take=8'),
          fetch('/api/waiter-requests'),
        ]);
        const w = await wRes.json();
        setWaiterRequests(Array.isArray(w) ? w : []);
        const s = await sRes.json();
        const o = await oRes.json();
        setStats(s);
        setRecent(Array.isArray(o) ? o : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Restaurant overview — {session?.user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetchStats} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <RefreshIcon className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} value={formatStats(stats[s.key], s.label)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium text-slate-500">Order</th>
                    <th className="pb-3 font-medium text-slate-500">Table</th>
                    <th className="pb-3 font-medium text-slate-500">Status</th>
                    <th className="pb-3 font-medium text-slate-500">Total</th>
                    <th className="pb-3 font-medium text-slate-500">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-900 font-medium">#{o.orderNumber}</td>
                      <td className="py-3 text-slate-600">#{o.table?.tableNumber}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                          o.status === 'READY' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' :
                          o.status === 'PENDING' ? 'border-amber-100 text-amber-700 bg-amber-50' :
                          'border-slate-100 text-slate-700 bg-slate-50'
                        }`}>{o.status}</span>
                      </td>
                      <td className="py-3 text-slate-900 font-medium">{formatINR(o.totalAmount)}</td>
                      <td className="py-3 text-slate-500">{relativeTime(o.createdAt)}</td>
                    </tr>
                  ))}
                  {!recent.length && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction href="/admin/foods" icon={<UtensilsIcon />} label="Manage Food" desc="Add, edit, categorize menu items" />
              <QuickAction href="/admin/tables" icon={<TableIcon />} label="Tables & QR" desc="Add tables and generate QR codes" />
              <QuickAction href="/admin/staff" icon={<UsersIcon />} label="Staff" desc="Create chef & billing accounts" />
              <QuickAction href="/admin/settings" icon={<SettingsIcon />} label="Restaurant Settings" desc="Name, logo, GST, hours" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4" /> Waiter Requests
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {waiterRequests.filter((r) => r.status === 'PENDING').slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Table #{r.table?.tableNumber}</p>
                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700">Pending</span>
                </div>
              ))}
              {waiterRequests.filter((r) => r.status === 'PENDING').length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No pending requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, key, icon: Icon, color, bg, value }) {
  return (
    <div className={`rounded-xl border border-slate-200 ${bg} p-4`}>
      <div className="flex justify-between mb-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <Icon className="h-4 w-4" style={{ color: 'currentColor' }} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function formatStats(value, label) {
  if (value === undefined || value === null) return '–';
  if (label.includes('Revenue')) return formatINR(value);
  return value;
}

function QuickAction({ href, icon: Icon, label, desc }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-brand transition"
    >
      <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </a>
  );
}

function Loader() {
  return <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
}

function RefreshIcon() {
  return <RefreshCw className="h-4 w-4" />;
}

function UtensilsIcon() {
  return <Utensils className="h-4 w-4" />;
}

function UsersIcon() {
  return <Users className="h-4 w-4" />;
}

function SettingsIcon() {
  return <Settings className="h-4 w-4" />;
}
