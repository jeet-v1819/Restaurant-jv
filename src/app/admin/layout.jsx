'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Layout,
  Utensils,
  Table,
  Users,
  Shield,
  Settings,
  LogOut,
  CreditCard,
  FileText,
  ChevronRight,
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard', href: '/admin', icon: Layout },
  { name: 'Food Management', href: '/admin/foods', icon: Utensils },
  { name: 'Categories', href: '/admin/categories', icon: Layout },
  { name: 'Tables & QR', href: '/admin/tables', icon: Table },
  { name: 'Staff', href: '/admin/staff', icon: Users },
  { name: 'Customers', href: '/admin/customers', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') return null;

  const isActive = (href) => typeof window !== 'undefined' && window.location.pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white md:flex flex-col">
        <div className="h-14 border-b border-slate-200 flex items-center justify-center px-6">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">JR</div>
          <span className="ml-2 font-bold text-slate-900 hidden sm:block">Admin</span>
        </div>
        <nav className="flex-1 py-6 space-y-1 px-3">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-brand'}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => router.push('/login?action=logout')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="text-sm font-semibold text-slate-900">
            {NAV.find((n) => isActive(n.href))?.name || 'Admin'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {session?.user?.name || 'Admin'}
            </span>
            <img
              src={session?.user?.image || '/placeholder.svg'}
              alt=""
              className="h-8 w-8 rounded-full border border-slate-200"
              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(session?.user?.name || 'Admin'); }}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
