'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { CartProvider } from '@/components/cart-context';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster position="top-right" richColors toastOptions={{ duration: 4000 }} />
      </CartProvider>
    </SessionProvider>
  );
}
