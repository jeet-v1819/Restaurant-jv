'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Layout, CreditCard, LogOut, User, Table, FileText, Shield,
} from 'lucide-react';

export default function BillingLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'BILLING' && session?.user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white flex-shrink-0 flex-col">
        <div className="h-14 border-b border-slate-200 flex items-center justify-center px-6">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">JR</div>
          <span className="ml-2 font-bold text-slate-900 hidden sm:block">Billing</span>
        </div>
        <nav className="flex-1 py-6 space-y-1 px-3">
          <a
            href="/billing"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand text-white font-medium text-sm shadow-lg"
          >
            <CreditCard className="h-5 w-5" /> Billing / POS
          </a>
          <a
            href="/billing/payments"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-brand transition"
          >
            <FileText className="h-5 w-5" /> Payment History
          </a>
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

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-sm font-semibold text-slate-900">Cash Billing</div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{session?.user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
