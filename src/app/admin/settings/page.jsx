'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings, Store, Phone, Mail, MapPin, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    restaurantName: '', restaurantLogo: '', contactPhone: '', contactEmail: '',
    address: '', openingHours: '', isOpen: true, gstPercentage: '5', currency: 'INR',
  });

  const load = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setForm({
        restaurantName: data.restaurantName || '',
        restaurantLogo: data.restaurantLogo || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        address: data.address || '',
        openingHours: data.openingHours || '',
        isOpen: data.isOpen !== undefined ? data.isOpen : true,
        gstPercentage: String(data.gstPercentage ?? 5),
        currency: data.currency || 'INR',
      });
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, restaurantLogo: ev.target.result, _file: file });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.restaurantLogo;
      if (form._file) {
        const fd = new FormData();
        fd.append('file', form._file);
        fd.append('folder', 'restaurant-jv/settings');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        imageUrl = data.url;
      }

      const payload = {
        restaurantName: form.restaurantName,
        restaurantLogo: imageUrl || undefined,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        address: form.address,
        openingHours: form.openingHours,
        isOpen: form.isOpen,
        gstPercentage: Number(form.gstPercentage),
        currency: form.currency,
      };

      const res = await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      toast.success('Settings saved');
      setSaving(false);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Restaurant Settings</h1>
        <p className="text-sm text-slate-500">Configure restaurant details, GST, currency and operating status</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Store className="h-4 w-4" /> Restaurant Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Restaurant Name</label>
                <input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Logo</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark" />
              {form.restaurantLogo && !form._file && (
                <img src={form.restaurantLogo} className="mt-2 h-24 rounded-md border border-slate-200 object-cover" alt="logo preview" />
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-4 w-4" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} type="email" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium text-slate-700">Opening Hours</label>
              <input value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="e.g. Mon - Sun: 11:00 AM - 11:00 PM" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Tax & Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">GST Percentage</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={form.gstPercentage} onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })} type="number" step="0.01" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <p className="text-xs text-slate-500">Applied to all bills</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Currency</label>
                <p className="text-sm font-bold text-slate-900">INR (₹)</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ToggleSwitch checked={form.isOpen} onChange={(checked) => setForm({ ...form, isOpen: checked })} />
                <div>
                  <p className="text-sm font-medium text-slate-900">Restaurant Status</p>
                  <p className="text-xs text-slate-500">{form.isOpen ? 'Open for orders' : 'Closed - customers cannot place orders'}</p>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:bg-slate-400 shadow-md">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${checked ? 'bg-brand border-brand' : 'bg-slate-200 border-slate-300'}`}
      aria-checked={checked}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

