'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Image, Search, RefreshCw , X as XIcon} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function FoodsPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const form = {
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    isAvailable: true,
    isFeatured: false,
    preparationTime: '',
  };

  const load = useCallback(async () => {
    try {
      const [fRes, cRes] = await Promise.all([fetch('/api/foods'), fetch('/api/categories')]);
      const f = await fRes.json();
      const c = await cRes.json();
      setFoods(Array.isArray(f) ? f : []);
      setCategories(Array.isArray(c) ? c : []);
    } catch (e) {
      toast.error('Failed to load food items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      form.image = ev.target.result;
      form._file = file;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.image;
      let fileToUpload = form._file;

      // If a new file was picked, upload to Cloudinary first
      if (fileToUpload) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const fd = new FormData();
            fd.append('file', fileToUpload);
            fd.append('folder', 'restaurant-jv/foods');
            return fd;
          })(),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
        imageUrl = uploadData.url;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        categoryId: form.categoryId,
        image: imageUrl || undefined,
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
        preparationTime: form.preparationTime ? Number(form.preparationTime) : null,
      };

      const res = editing
        ? await fetch(`/api/foods/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
        : await fetch('/api/foods', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save food item');

      toast.success(editing ? 'Food updated' : 'Food added');
      setOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      const res = await fetch(`/api/foods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Food deleted');
      load();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const toggleAvailability = async (id, current) => {
    try {
      const res = await fetch(`/api/foods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !current }),
      });
      if (!res.ok) throw new Error('Failed');
      load();
    } catch (e) {
      toast.error('Failed to update availability');
    }
  };

  const resetForm = () => {
    form.name = '';
    form.description = '';
    form.price = '';
    form.categoryId = '';
    form.image = '';
    form.isAvailable = true;
    form.isFeatured = false;
    form.preparationTime = '';
    form._file = undefined;
  };

  const openEdit = (item) => {
    setEditing(item);
    form.name = item.name;
    form.description = item.description || '';
    form.price = String(item.price);
    form.categoryId = item.categoryId;
    form.image = item.image || '';
    form.isAvailable = item.isAvailable;
    form.isFeatured = item.isFeatured;
    form.preparationTime = String(item.preparationTime || '');
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Food Management</h1>
          <p className="text-sm text-slate-500">Add, edit, and manage menu items</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditing(null); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition shadow-md"
        >
          <Plus className="h-4 w-4" /> Add Food Item
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand transition"
            placeholder="Search food items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Image</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Category</th>
                <th className="px-4 py-3 font-medium text-slate-500">Price</th>
                <th className="px-4 py-3 font-medium text-slate-500">Available</th>
                <th className="px-4 py-3 font-medium text-slate-500">Featured</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="h-32 flex items-center justify-center text-slate-500">Loading...</td></tr>
              ) : filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                        {item.image ? <img src={item.image} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-slate-400"><Image className="h-5 w-5" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category?.name || '–'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatINR(item.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition ${item.isAvailable ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-rose-100 text-rose-700 bg-rose-50'}`}
                      >
                        {item.isAvailable ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {item.isFeatured ? <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">★</span> : '–'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-brand mr-3"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="h-32 text-center text-slate-500">No food items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Food Item' : 'Add Food Item'}</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Food Name" name="name" value={form.name} onChange={(e) => { form.name = e.target.value; }} required />
              <SelectField label="Category" value={form.categoryId} onChange={(e) => { form.categoryId = e.target.value; }} options={categories.map((c) => ({ value: c.id, label: c.name }))} required />
            </div>
            <InputField label="Description" name="description" value={form.description} onChange={(e) => { form.description = e.target.value; }} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Price (₹)" name="price" value={form.price} type="number" onChange={(e) => { form.price = e.target.value; }} required />
              <InputField label="Prep Time (min)" name="preparationTime" value={form.preparationTime} type="number" onChange={(e) => { form.preparationTime = e.target.value; }} />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => { form.isFeatured = e.target.checked; }} />
                Featured item
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => { form.isAvailable = e.target.checked; }} />
                Available
              </label>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark" />
              {form.image && !form._file && (
                <img src={form.image} className="mt-2 h-24 rounded-md border border-slate-200 object-cover" alt="preview" />
              )}
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

function InputField({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
        required={required}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="rounded-lg border border-slate-300 bg-white pl-3 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
        required={required}
      >
        <option value="">Select</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
