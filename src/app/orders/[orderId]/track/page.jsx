'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, RefreshCw, CheckCircle2, Clock as ClockIcon, X as XIcon, Loader2, Bell } from 'lucide-react';
import { useRealTime } from '@/hooks/use-real-time';
import { relativeTime } from '@/lib/utils';

const STATUS_ORDER = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'CANCELLED', 'REJECTED'];
const STATUS_LABEL = {
  PENDING: 'Order Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};
const STATUS_COLOR = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-blue-100 text-blue-800 border-blue-200',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function OrderTrackPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiterStatus, setWaiterStatus] = useState(null);
  const [tableId, setTableId] = useState(null);

  const { refetch } = useRealTime({
    channels: ['customer'],
    onEvent: (event, data) => {
      if (event === 'order_updated' && data.order && data.order.id === params.orderId) {
        setOrder(data.order);
        if (data.order.status === 'READY') toast.success('Your order is ready!');
        if (data.order.status === 'REJECTED') toast.error('Your order was rejected by the kitchen.');
        if (data.order.status === 'CANCELLED') toast.error('Your order was cancelled.');
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${params.orderId}`);
        const data = await res.json();
        if (!cancelled && !data.error) { setOrder(data); if (data.table) setTableId(data.table.id); }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(() => {
      if (order && STATUS_ORDER.indexOf(order.status) >= 4) return; // terminal
      fetch(`/api/orders/${params.orderId}`)
        .then((r) => r.json())
        .then((d) => { if (!d.error && d.status !== order?.status) setOrder(d); });
    }, 8000);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderId, order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Order not found</h2>
          <a href="/menu" className="mt-4 inline-block text-brand underline">Go to menu</a>
        </div>
      </div>
    );
  }

  const callWaiter = async () => {
    if (!tableId) return;
    try {
      const res = await fetch('/api/waiter-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setWaiterStatus('PENDING');
      toast.success('Waiter called');
    } catch (err) {
      toast.error(err.message || 'Failed to call waiter');
    }
  };

  const terminal = ['READY', 'CANCELLED', 'REJECTED'].includes(order.status);
  const prep = order.estimatedPrepTime ? `${order.estimatedPrepTime} minutes` : 'Not set yet';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-brand">
            <span className="flex items-center gap-1" aria-hidden="true"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></span> Back
          </button>
          <span className="text-xs text-slate-400">/</span>
          <a href="/menu" className="text-sm text-slate-500 hover:text-brand">Menu</a>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Order #{order.orderNumber}</h2>
              <p className="text-sm text-slate-500">
                Table {order.table?.tableNumber} · {relativeTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {waiterStatus === 'PENDING' ? (
                <span className="px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Waiter Requested
                </span>
              ) : (
                <button onClick={callWaiter} disabled={waiterStatus === 'PENDING'} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <Bell className="h-4 w-4" /> Call Waiter
                </button>
              )}
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Estimated Preparation Time" value={prep} icon={<ClockIcon />} />
            <StatCard label="Order Total" value={`₹${Number(order.totalAmount).toLocaleString('en-IN')}`} icon={<CreditCardIcon />} />
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wider">Order Status</h3>
            <div className="relative space-y-2">
              {STATUS_ORDER.map((status, i) => {
                const active = STATUS_ORDER.indexOf(order.status) >= i;
                const completed = STATUS_ORDER.indexOf(order.status) > i;
                return (
                  <div key={status} className="relative flex items-center gap-3">
                    {i > 0 && (
                      <div className="w-[2px] h-4 absolute left-6 top-4 bg-slate-200" />
                    )}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 border-2 shrink-0 ${
                      completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : active
                        ? 'border-brand bg-brand text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-400'
                    }`}>
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${completed ? 'text-emerald-700' : active ? 'text-brand' : 'text-slate-400'}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wider">Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">{item.quantity}× {item.foodName}</span>
                      <span className="text-sm font-medium text-slate-900">₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                    </div>
                    {item.specialInstructions && (
                      <p className="mt-1 text-xs text-slate-500 italic">{item.specialInstructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {terminal && order.status === 'READY' && (
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-800">Your order is ready!</h3>
                <p className="text-sm text-emerald-700 mt-1">Please collect your order at the counter.</p>
              </div>
            </div>
          )}

          {terminal && (order.status === 'CANCELLED' || order.status === 'REJECTED') && (
            <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <XIcon className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-rose-800">Order {order.status.toLowerCase()}</h3>
                <p className="text-sm text-rose-700 mt-1">
                  {order.status === 'REJECTED' ? 'The kitchen could not prepare this order.' : 'The order was cancelled.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {!terminal && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4" /> Status updates in real time. Page refreshes automatically.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-slate-100 text-brand">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}



function CreditCardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
