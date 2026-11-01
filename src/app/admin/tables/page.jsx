'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, QrCode, Link as LinkIcon, RefreshCw , X as XIcon} from 'lucide-react';
import QRCode from 'qrcode';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [form, setForm] = useState({ tableNumber: '', status: 'AVAILABLE', isActive: true });

  const load = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { tableNumber: Number(form.tableNumber), status: form.status, isActive: form.isActive };
      const res = editing
        ? await fetch(`/api/tables/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
        : await fetch('/api/tables', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save table');
      toast.success(editing ? 'Table updated' : 'Table added');
      setOpen(false);
      setEditing(null);
      setForm({ tableNumber: '', status: 'AVAILABLE', isActive: true });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Table deleted');
      load();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ tableNumber: String(t.tableNumber), status: t.status, isActive: t.isActive });
    setOpen(true);
  };

  const showQR = async (t) => {
    try {
      const dataUrl = await QRCode.toDataURL(`${window.location.origin}/table/${t.tableNumber}`, { width: 260, margin: 2 });
      setQrDataUrl(dataUrl);
      setQrModal(t);
    } catch (e) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQR = async (tableNumber) => {
    try {
      const dataUrl = await QRCode.toDataURL(`${window.location.origin}/table/${tableNumber}`, { width: 300, margin: 2 });
      const link = document.createElement('a');
      link.download = `table-${tableNumber}-qr.png`;
      link.href = dataUrl;
      link.click();
      toast.success('QR code downloaded');
    } catch (e) {
      toast.error('Failed to generate QR code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tables & QR Codes</h1>
          <p className="text-sm text-slate-500">Manage restaurant tables and generate QR codes for customers</p>
        </div>
        <button onClick={() => { setForm({ tableNumber: '', status: 'AVAILABLE', isActive: true }); setEditing(null); setOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition shadow-md">
          <Plus className="h-4 w-4" /> Add Table
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Table No.</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">QR Code</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="h-32 flex items-center justify-center text-slate-500">Loading...</td></tr>
              ) : tables.length ? (
                tables.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">#{t.tableNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.status === 'AVAILABLE' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-amber-100 text-amber-700 bg-amber-50'}`}>
                        {t.status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => showQR(t)} className="flex items-center gap-2 text-sm font-medium text-brand hover:underline">
                        <QrCode className="h-4 w-4" /> View QR
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-brand mr-3"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="h-32 text-center text-slate-500">No tables found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Table' : 'Add Table'}</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Table Number</label>
              <input value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} type="number" className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand">
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:bg-slate-400">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* QR modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQrModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 flex flex-col items-center">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Table #{qrModal.tableNumber}</h3>
            <p className="mb-6 text-sm text-slate-500">Customers scan to open this table for ordering</p>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              {qrDataUrl ? <img className="mb-3" src={qrDataUrl} alt="QR" /> : <div className="h-32 flex items-center justify-center text-slate-500">Generating...</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadQR(qrModal.tableNumber)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition"><LinkIcon className="h-4 w-4" /> Download</button>
              <button onClick={() => setQrModal(null)} className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
