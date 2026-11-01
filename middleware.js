import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;
      const role = token ? token.role : null;

      // NextAuth endpoints are handled by next-auth itself
      if (pathname.startsWith('/api/auth')) return true;

      // Admin only
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return role === 'ADMIN';
      }
      // Chef (admins can view too)
      if (pathname.startsWith('/chef') || pathname.startsWith('/api/chef')) {
        return role === 'CHEF' || role === 'ADMIN';
      }
      // Billing (admins can view too)
      if (pathname.startsWith('/billing') || pathname.startsWith('/api/billing')) {
        return role === 'BILLING' || role === 'ADMIN';
      }
      // Customer area (authenticated customers or admins)
      if (pathname.startsWith('/customer') || pathname.startsWith('/api/customer')) {
        return role === 'CUSTOMER' || role === 'ADMIN';
      }

      // Public pages and public APIs (menu, tables, orders, auth, etc.) are open
      return true;
    },
  },
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/chef/:path*',
    '/billing/:path*',
    '/customer/:path*',
    '/api/:path*',
  ],
};
