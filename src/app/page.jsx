import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { Phone, MapPin, Clock, Utensils } from 'lucide-react';

async function getSettings() {
  try {
    return await prisma.restaurantSettings.findFirst();
  } catch (e) {
    return null;
  }
}

async function getCategories() {
  try {
    return await prisma.foodCategory.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { name: 'asc' },
    });
  } catch (e) {
    return [];
  }
}

async function getFoods(where) {
  try {
    return await prisma.foodItem.findMany({
      where,
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const [settings, categories, featured, popular] = await Promise.all([
    getSettings(),
    getCategories(),
    getFoods({ isAvailable: true, isFeatured: true }),
    getFoods({ isAvailable: true }),
  ]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              {settings?.restaurantLogo ? (
                <img src={settings.restaurantLogo} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-lg">
                  JR
                </div>
              )}
              <span className="text-xl font-bold tracking-tight">{settings?.restaurantName || 'JV Restaurant'}</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/menu" className="hover:text-brand transition">Menu</Link>
              <Link href="#categories" className="hover:text-brand transition">Categories</Link>
              <Link href="#popular" className="hover:text-brand transition">Popular</Link>
              <a href="/login" className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition">
                Login
              </a>
            </div>
            <div className="md:hidden">
              <button className="p-2 text-slate-600 hover:text-brand">
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            {settings?.restaurantName || 'JV Restaurant'}<br />
            <span className="text-brand-light">Authentic Flavors, Every Day</span>
          </h1>
          <p className="mt-6 text-lg text-slate-200 max-w-2xl mx-auto">
            Order from your table, watch your food being prepared in real time, and pay cash at the counter.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu" className="px-8 py-3.5 bg-brand text-white rounded-xl font-semibold text-lg hover:bg-brand-dark transition shadow-lg">
              Order Online
            </Link>
            <a href="#contact" className="px-8 py-3.5 border border-white/30 rounded-xl font-semibold text-lg text-white hover:bg-white/10 transition">
              Contact Us
            </a>
          </div>
          {settings?.isOpen === false && (
            <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-100">
              <AlertCircle className="h-4 w-4" /> Currently closed
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">Browse by Category</h2>
            <p className="mt-2 text-slate-600">Choose what you are in the mood for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.slug}`}
                className="group block"
              >
                <div className="aspect-square rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand transition">
                      <TagIcon className="h-10 w-10" />
                    </div>
                  )}
                  <div className="px-4 py-3">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand transition">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Featured Items</h2>
              <p className="text-slate-600">Chef&apos;s recommendations</p>
            </div>
            <Link href="/menu" className="text-sm font-medium text-brand hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular */}
      <section id="popular" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Popular This Week</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {popular.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section id="contact" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand/10 text-brand flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Visit Us</h3>
                <p className="text-slate-600">{settings?.address || '123 Main Street, Rajkot, Gujarat, India'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand/10 text-brand flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Call Us</h3>
                <p className="text-slate-600">{settings?.contactPhone || '+91 98765 43210'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand/10 text-brand flex-shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Opening Hours</h3>
                <p className="text-slate-600">{settings?.openingHours || 'Mon - Sun: 11:00 AM - 11:00 PM'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-500 text-sm">
          {settings?.restaurantName || 'JV Restaurant'} &copy; {new Date().getFullYear()}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeaturedCard({ item }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
      ) : (
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
          <Utensils className="h-12 w-12" />
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-600">
          {item.category?.name}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-brand transition">{item.name}</h3>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description || ''}</p>
        <p className="mt-2 font-bold text-slate-900">{formatINR(item.price)}</p>
      </div>
    </div>
  );
}

function FoodCard({ item }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-slate-100 flex items-center justify-center text-slate-400">
          <Utensils className="h-10 w-10" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{item.description || ''}</p>
        <p className="mt-2 font-bold text-slate-900">{formatINR(item.price)}</p>
        <Link
          href="/menu"
          className="mt-3 block w-full text-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand text-brand hover:bg-brand hover:text-white transition"
        >
          Order Now
        </Link>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function AlertCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16h.01M7 16l5 5M12 12l-5.5 5.5a3 3 0 01-4.243-4.243L8.485 9.771l5.5-5.5a1 1 0 011.414 0l1.414 1.414a1 1 0 010 1.414l-5.5 5.5z" />
    </svg>
  );
}
