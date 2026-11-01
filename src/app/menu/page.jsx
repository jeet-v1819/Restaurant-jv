'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/components/cart-context';
import { toast } from 'sonner';
import { Search, Filter, SortAsc, DollarSign, Pizza, ChevronRight, AlertCircle, ShoppingCart } from 'lucide-react';
import { formatINR } from '@/lib/utils'
import { useRealTime } from '@/hooks/use-real-time';;

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, addItem, itemCount } = useCart();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'name',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          fetch('/api/foods?available=true'),
          fetch('/api/categories'),
        ]);
        const f = await fRes.json();
        const c = await cRes.json();
        if (!cancelled) {
          setFoods(Array.isArray(f) ? f : []);
          setCategories(Array.isArray(c) ? c : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useRealTime({
    channels: ['customer'],
    onEvent: (event, data) => {
      if (event === 'food_availability_changed') load();
    },
  });

  const filtered = foods
    .filter((item) => {
      if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.category && item.categoryId !== getCategoryId(filter.category)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filter.sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (filter.sort === 'price-desc') return Number(b.price) - Number(a.price);
      return a.name.localeCompare(b.name);
    });

  const handleAdd = (item) => {
    if (!item.isAvailable) {
      toast.error('Item is currently unavailable');
      return;
    }
    addItem({
      foodItemId: item.id,
      foodName: item.name,
      foodPrice: Number(item.price),
      image: item.image,
      specialInstructions: '',
    });
    toast.success(`${item.name} added to cart`, {
      description: `${itemCount + 1} item${itemCount !== 0 ? 's' : ''} in cart`,
    });
  };

  const handleSearchChange = (e) => setFilter({ ...filter, search: e.target.value });
  const handleCategoryChange = (e) => setFilter({ ...filter, category: e.target.value });
  const handleSortChange = (e) => setFilter({ ...filter, sort: e.target.value });

  const catName = (id) => categories.find((c) => c.id === id)?.name || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-14 z-20">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex w-full lg:w-auto items-center">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                className="ml-2 block w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                placeholder="Search food items..."
                value={filter.search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand transition"
                value={filter.category}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (c.itemsCount || true) && <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand transition"
                value={filter.sort}
                onChange={handleSortChange}
              >
                <option value="name">Sort: A–Z</option>
                <option value="price-asc">Sort: Price Low → High</option>
                <option value="price-desc">Sort: Price High → Low</option>
              </select>
              <a href="/cart" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition shadow-sm">
                <ShoppingCart className="h-5 w-5" /> Cart <span className="font-bold">{itemCount}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setFilter({ ...filter, category: '' })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!filter.category ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter({ ...filter, category: c.id })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${filter.category === c.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Menu</h2>
              <p className="text-slate-500">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <Pizza className="h-12 w-12 text-slate-300" />
                  <p className="text-slate-500">Loading menu...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((item) => (
                  <FoodCard key={item.id} item={item} onAdd={handleAdd} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryId(slugOrId) {
  // slugOrId is an id here
  return slugOrId;
}

function FoodCard({ item, onAdd }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Pizza className="h-10 w-10" />
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1 rounded bg-white text-[11px] font-bold text-white uppercase tracking-tighter">
              Unavailable
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
          disabled={!item.isAvailable}
          className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-lg ${
            item.isAvailable ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {item.isAvailable ? 'Add' : '–'}
        </button>
        <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/90 text-[11px] font-bold text-slate-700">
          {formatINR(item.price)}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-900 leading-snug">{item.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {item.category?.name || ''}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="font-bold text-slate-900">{formatINR(item.price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            disabled={!item.isAvailable}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${item.isAvailable ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-96 flex flex-col items-center justify-center text-center">
      <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-900">No items found</h3>
      <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="animate-pulse flex items-center justify-center h-96 bg-slate-50">
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <div className="h-4 w-64 rounded bg-slate-200"></div>
        <div className="h-4 w-48 rounded bg-slate-200"></div>
      </div>
    </div>}>
      <MenuContent />
    </Suspense>
  );
}
