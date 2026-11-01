'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Layout, Utensils, LogOut, User, Shield, Bell, Clock, X,
} from 'lucide-react';

export default function ChefLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'CHEF' && session?.user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') return null;

  return (
    <div className="flex h-screen bg-slate-900">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex-shrink-0 flex-col">
        <div className="h-14 border-b border-slate-800 flex items-center justify-center px-6">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">JR</div>
          <span className="ml-2 font-bold text-white hidden sm:block">Kitchen</span>
        </div>
        <nav className="flex-1 py-6 space-y-1 px-3">
          <a
            href="/chef"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand text-white font-medium text-sm shadow-lg"
          >
            <Utensils className="h-5 w-5" /> Kitchen Dashboard
          </a>
          <a
            href="/chef/availability"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <Shield className="h-5 w-5" /> Food Availability
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => router.push('/login?action=logout')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="text-sm font-semibold text-slate-900">Kitchen Display System</div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{session?.user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
