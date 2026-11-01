'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Table as TableIcon, CreditCard, RefreshCw, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRealTime } from '@/hooks/use-real-time';
import { relativeTime } from '@/lib/utils';

export default function BillingPOS() {
  const [tableNumber, setTableNumber] = useState('');
  const [orders, setOrders] = useState([]);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const { refetch } = useRealTime({
    channels: ['billing'],
    onEvent: (event, data) => {
      if (event === 'payment_paid') {
        toast.success(`Payment received for Order #${data.orderNumber}`);
        // Refresh current bill if same table
        if (tableNumber) loadTable(tableNumber);
      }
      if (event === 'session_closed') {
        toast.info(`Table ${data.tableNumber} session closed`);
        if (tableNumber === String(data.tableNumber)) {
          setOrders([]);
          setBill(null);
        }
      }
    },
    refetchInterval: 8000,
  });

  const loadTable = useCallback(async (num) => {
    try {
      const res = await fetch(`/api/payments?tableNumber=${num}`);
      const data = await res.json();
      const raw = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      // Payments endpoint returns payment records with the nested order
      setOrders(
        raw.map((p) => ({
          ...p.order,
          id: p.orderId,
          payment: { status: p.status },
        }))
      );
      setBill(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSearch = async () => {
    const num = Number(tableNumber);
    if (!num) { toast.error('Enter a table number'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/payments?tableNumber=${num}`);
      const data = await res.json();
      const raw = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      // Payments endpoint returns payment records with the nested order
      setOrders(
        raw.map((p) => ({
          ...p.order,
          id: p.orderId,
          payment: { status: p.status },
        }))
      );
      setBill(data);
    } catch (e) {
      toast.error('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (orderId) => {
    setPaying(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      toast.success('Payment recorded');
      loadTable(tableNumber);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const gst = (bill?.total || 0);
  const grandTotal = (bill?.grandTotal || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Billing</h1>
          <p className="text-sm text-slate-500">Enter table number, collect cash, mark as paid</p>
        </div>
        <div className="flex gap-2">
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            type="number"
            placeholder="Table No."
            className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button onClick={handleSearch} disabled={loading} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:bg-slate-400">
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TableIcon className="h-4 w-4" /> Unpaid Orders for Table {tableNumber || '—'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500">Order ID</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Food Items</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(orders || []).length ? (
                    (orders || []).map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">#{o.orderNumber}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">
                          <div className="space-y-1">
                            {o.items.map((i) => (
                              <div key={i.id} className="flex justify-between text-sm">
                                <span>{i.quantity}× {i.foodName}</span>
                                <span className="font-medium">{formatINR(i.totalPrice)}</span>
                              </div>
                            ))}
                            {o.specialInstructions && <span className="text-xs text-slate-400 italic">{o.specialInstructions}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : 0}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatINR(o.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${o.payment?.status === 'PAID' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-rose-100 text-rose-700 bg-rose-50'}`}>
                            {o.payment?.status || 'UNPAID'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(o.payment?.status || 'UNPAID') !== 'PAID' ? (
                            <button onClick={() => markPaid(o.id)} disabled={paying} className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">
                      {orders.length === 0 && tableNumber ? 'No unpaid orders for this table' : 'Search a table to view its bill'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Bill Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatINR(bill?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST (5%)</span>
                <span className="font-medium text-slate-900">{formatINR(bill?.gst || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-xl font-bold text-brand">{formatINR(grandTotal)}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
              <p className="text-xs text-slate-500">Payment Mode: Cash</p>
              <p className="text-xs text-slate-500">Collected by: {bill?.payments?.[0]?.paidBy?.name || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {bill && bill.payments && bill.payments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" /> Payment History (This Session)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Order</th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right">GST</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Paid At</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">#{p.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatINR(p.gstAmount)}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(p.paidAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.paidBy?.name || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(amount || 0));
}
