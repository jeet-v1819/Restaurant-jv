'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Image , X as XIcon} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image: '', _file: null });

  const load = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setForm({ ...form, image: ev.target.result, _file: file }); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.image;
      if (form._file) {
        const fd = new FormData();
        fd.append('file', form._file);
        fd.append('folder', 'restaurant-jv/categories');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        imageUrl = data.url;
      }

      const payload = { name: form.name, image: imageUrl || undefined };
      const res = editing
        ? await fetch(`/api/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
        : await fetch('/api/categories', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');
      toast.success(editing ? 'Category updated' : 'Category added');
      setOpen(false);
      setEditing(null);
      setForm({ name: '', image: '', _file: null });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Category deleted');
      load();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, image: c.image || '', _file: null });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Manage food categories</p>
        </div>
        <button onClick={() => { setForm({ name: '', image: '', _file: null }); setEditing(null); setOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition shadow-md">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Image</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="h-32 flex items-center justify-center text-slate-500">Loading...</td></tr>
              ) : categories.length ? (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                        {c.image ? <img src={c.image} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-slate-400"><Image className="h-5 w-5" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-brand mr-3"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="h-32 text-center text-slate-500">No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Category' : 'Add Category'}</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Category Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand" required />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Category Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark" />
              {form.image && !form._file && <img src={form.image} className="mt-2 h-24 rounded-md border border-slate-200 object-cover" alt="preview" />}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:bg-slate-400">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
