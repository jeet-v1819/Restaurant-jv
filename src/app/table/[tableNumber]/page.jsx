'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TablePage({ params }) {
  const router = useRouter();
  const { tableNumber } = params;

  useEffect(() => {
    if (!tableNumber) {
      toast.error('Invalid table');
      router.push('/menu');
      return;
    }
    // Preselect the table for the ordering flow
    try {
      localStorage.setItem('rj_table', String(tableNumber));
    } catch (e) {
      // ignore
    }
    toast.info(`Table ${tableNumber} selected`);
    router.push('/menu');
  }, [tableNumber, router]);

  return null;
}
