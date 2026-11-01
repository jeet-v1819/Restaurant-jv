'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart-context';
import { toast } from 'sonner';
import { Trash, Minus, Plus, Table, AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { cart, loaded, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const [tableNumber, setTableNumber] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('rj_table');
      if (saved) return saved;
    }
    return '';
  });
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loaded) return null;

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-20">
        <div className="mx-auto max-w-sm text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="text-slate-500 mt-1">Add some delicious food from the menu.</p>
          <a href="/menu" className="mt-4 inline-block px-6 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition">
            Browse Menu
          </a>
        </div>
      </div>
    );
  }

  const gstPct = 5;
  const gst = (subtotal * gstPct) / 100;
  const grandTotal = subtotal + gst;

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      toast.error('Please select a table number');
      return;
    }
    const num = Number(tableNumber);
    if (!num || num <= 0) {
      toast.error('Enter a valid table number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: num,
          items: cart.map((c) => ({
            foodItemId: c.foodItemId,
            foodName: c.foodName,
            foodPrice: c.foodPrice,
            quantity: c.quantity,
            specialInstructions: c.specialInstructions || '',
          })),
          specialInstructions,
          guestName: 'Guest',
          guestPhone: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      router.push(`/orders/${data.id}/track`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand"
            >
              <ArrowLeft className="h-5 w-5" /> Back to menu
            </button>
            <div className="text-sm font-semibold text-slate-900">Shopping Cart</div>
            <div className="text-sm font-bold text-slate-900">{formatINR(grandTotal)}</div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Cart Items</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={`${item.foodItemId}-${item.foodName}`} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <CreditCard className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-slate-900">{item.foodName}</h3>
                      <span className="font-medium text-slate-900">{formatINR(Number(item.foodPrice) * item.quantity)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.specialInstructions || 'No special instructions'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.foodItemId, item.foodName, item.quantity - 1)}
                        className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-slate-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.foodItemId, item.foodName, item.quantity + 1)}
                        className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.foodItemId, item.foodName)}
                        className="ml-4 p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-80 flex-shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%)</span>
                  <span className="font-medium">{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Table Number <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand transition"
                  placeholder="e.g. 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">Select the table where you are seated.</p>

                <label className="block text-sm font-semibold text-slate-700 mt-4">Special Instructions</label>
                <textarea
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand transition"
                  rows={2}
                  placeholder="e.g. Extra spicy, no onions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || itemCount === 0 || !tableNumber}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-400 transition shadow-md"
                >
                  <CreditCard className="h-5 w-5" /> Place Order – {formatINR(grandTotal)}
                </button>
                <p className="mt-2 text-xs text-slate-500 text-center">Cash payment at the counter after dining.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
