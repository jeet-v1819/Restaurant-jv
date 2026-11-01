'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Clock, Bell, X as XIcon, CheckCircle2, RefreshCw, Utensils } from 'lucide-react';
import { relativeTime } from '@/lib/utils';
import { useRealTime } from '@/hooks/use-real-time';

const STATUS_COLORS = {
  PENDING: 'bg-amber-50 border-amber-200 text-amber-800',
  ACCEPTED: 'bg-blue-50 border-blue-200 text-blue-800',
  PREPARING: 'bg-blue-50 border-blue-200 text-blue-800',
  READY: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  CANCELLED: 'bg-rose-50 border-rose-200 text-rose-800',
  REJECTED: 'bg-rose-50 border-rose-200 text-rose-800',
};

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const { refetch } = useRealTime({
    channels: ['kitchen'],
    onEvent: (event, data) => {
      if (event === 'order_created' && data.order) {
        setOrders((prev) => [data.order, ...prev]);
        toast.info(`New order for Table ${data.tableNumber}`, {
          description: `Order #${data.order.orderNumber}`,
        });
      }
      if (event === 'order_updated' && data.order) {
        setOrders((prev) => prev.map((o) => o.id === data.order.id ? data.order : o));
        if (data.order.status === 'READY') {
          toast.success(`Order #${data.order.orderNumber} marked ready`);
        }
      }
      if (event === 'order_cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
      }
    },
    refetchInterval: 6000,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?take=100');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [load]);

  const activeOrders = orders.filter((o) => o.status !== 'READY' && o.status !== 'CANCELLED' && o.status !== 'REJECTED');

  const handleStatus = async (id, status, estimatedPrepTime = null) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, estimatedPrepTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kitchen Dashboard</h1>
          <p className="text-sm text-slate-500">Live orders — updates in real time</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900">
            {activeOrders.length} Active Order{activeOrders.length !== 1 ? 's' : ''}
          </span>
          <button onClick={load} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeOrders.length === 0 ? (
          <div className="lg:col-span-3">
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <Utensils className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No active orders</h3>
              <p className="text-slate-500">Orders placed by customers will appear here instantly.</p>
            </div>
          </div>
        ) : (
          activeOrders.map((order) => (
            <OrderCard key={order.id} order={order} onStatus={handleStatus} />
          ))
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" /> Recently Completed
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 font-medium text-slate-500">Table</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Total</th>
                <th className="px-4 py-3 font-medium text-slate-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders
                .filter((o) => o.status === 'READY' || o.status === 'CANCELLED' || o.status === 'REJECTED')
                .slice(0, 15)
                .map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">#{o.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">#{o.table?.tableNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${o.status === 'READY' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-rose-100 text-rose-700 bg-rose-50'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(o.updatedAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatus }) {
  const [prepTime, setPrepTime] = useState(order.estimatedPrepTime ? String(order.estimatedPrepTime) : '');
  const statusIndex = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].indexOf(order.status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold border ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Order #{order.orderNumber}</h3>
          <p className="text-sm text-slate-500">Table {order.table?.tableNumber} · {order.guestName || 'Guest'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900">{formatINR(order.totalAmount)}</p>
          <p className="text-xs text-slate-500">{relativeTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-slate-600">{item.quantity}× {item.foodName}</span>
              <span className="font-medium text-slate-900">{formatINR(item.totalPrice)}</span>
            </div>
          ))}
        </div>
      </div>

      {order.specialInstructions && (
        <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">{order.specialInstructions}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Status actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statusIndex < 1 && (
            <button
              onClick={() => onStatus(order.id, 'ACCEPTED')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
              disabled={order.status === 'REJECTED' || order.status === 'CANCELLED'}
            >
              Accept Order
            </button>
          )}
          {statusIndex >= 1 && statusIndex < 3 && (
            <>
              <button
                onClick={() => onStatus(order.id, 'REJECTED')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 transition shadow-sm"
              >
                Reject Order
              </button>
              <button
                onClick={() => onStatus(order.id, 'PREPARING')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition shadow-sm"
              >
                Mark Preparing
              </button>
            </>
          )}
          {statusIndex >= 3 && (
            <button
              onClick={() => onStatus(order.id, 'READY')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
            >
              Mark Ready
            </button>
          )}
        </div>

        {order.status === 'ACCEPTED' && (
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Estimated Preparation Time (minutes)</label>
            <div className="flex gap-2">
              <input
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                type="number"
                min="1"
                className="flex-1 rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                onClick={() => onStatus(order.id, order.status, Number(prepTime) || undefined)}
                className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition"
              >
                Set
              </button>
            </div>
          </div>
        )}

        {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && order.estimatedPrepTime && (
          <p className="text-xs text-slate-500">Estimated prep: {order.estimatedPrepTime} minutes</p>
        )}
      </div>
    </div>
  );
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(amount || 0));
}

function Loader() {
  return <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
}
