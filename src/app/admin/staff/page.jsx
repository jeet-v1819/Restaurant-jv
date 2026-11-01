'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, User as UserIcon, Eye, EyeOff, Shield, ChevronRight , X as XIcon} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CHEF', phone: '', address: '', employeeId: '' });

  const load = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      const res = editing
        ? await fetch(`/api/staff/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
        : await fetch('/api/staff', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save staff');
      toast.success(editing ? 'Staff updated' : 'Staff account created');
      setOpen(false);
      setEditing(null);
      setForm({ name: '', email: '', password: '', role: 'CHEF', phone: '', address: '', employeeId: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this staff account will also remove the user login. Continue?')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Staff removed');
      load();
    } catch (e) {
      toast.error('Failed to delete staff');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwd) return;
    try {
      const res = await fetch(`/api/staff/${resetOpen}`, { method: 'PUT', body: JSON.stringify({ password: resetPwd }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Reset failed');
      toast.success('Password reset');
      setResetOpen(null);
      setResetPwd('');
      load();
    } catch (e) {
      toast.error('Failed to reset password');
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.user.name, email: s.user.email, password: '', role: s.user.role, phone: s.user.phone || '', address: s.user.address || '', employeeId: s.employeeId });
    setOpen(true);
  };

  const toggleActive = async (id, current) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: !current }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Account ${!current ? 'activated' : 'deactivated'}`);
      load();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500">Create chef and billing staff accounts</p>
        </div>
        <button onClick={() => { setForm({ name: '', email: '', password: '', role: 'CHEF', phone: '', address: '', employeeId: '' }); setEditing(null); setOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition shadow-md">
          <Plus className="h-4 w-4" /> Create Staff Account
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Employee ID</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="h-32 flex items-center justify-center text-slate-500">Loading...</td></tr>
              ) : staff.length ? (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.employeeId}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${s.user.role === 'CHEF' ? 'border-blue-100 text-blue-700 bg-blue-50' : 'border-purple-100 text-purple-700 bg-purple-50'}`}>
                        {s.user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(s.id, s.user.isActive)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition ${s.user.isActive ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-slate-100 text-slate-700 bg-slate-50'}`}>
                        {s.user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-brand mr-3"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => { setResetOpen(s.id); setResetPwd(''); }} className="text-slate-400 hover:text-brand mr-3"><Shield className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="h-32 text-center text-slate-500">No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Staff' : 'Create Staff Account'}</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Employee ID</label>
                <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
            </div>
            {!editing && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="CHEF">Chef</option>
                  <option value="BILLING">Billing Staff</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:bg-slate-400">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset password modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResetOpen(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
              <button onClick={() => setResetOpen(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <input value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} type="password" className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setResetOpen(null)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
