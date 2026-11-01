import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCart } from '@/components/cart-context';
import {
  Menu,
  X,
  ShoppingCart,
  User,
  ChefHat,
  CreditCard,
  Store,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const router = useRouter();

  const staffHref = session ? `/${session.user.role.toLowerCase()}` : '/login';

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-lg shadow-sm">
              JR
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">JV Restaurant</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" exact>Home</NavLink>
            <NavLink href="/menu">Menu</NavLink>
            {session && (
              <>
                <NavLink href="/orders">My Orders</NavLink>
                <a href="/cart" className="relative px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </a>
                <NavLink href={staffHref} className="px-3 py-2 text-sm font-medium text-brand hover:bg-brand/10 rounded-lg transition">
                  {session.user.role} Panel
                </NavLink>
                <button onClick={() => router.push('/login?action=logout')} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  Logout
                </button>
              </>
            )}
            {!session && (
              <>
                <a href="/login" className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Login</a>
                <a href="/register" className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition">Sign Up</a>
              </>
            )}
          </div>

          <button className="p-2 text-slate-600 hover:text-brand md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, exact }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </Link>
  );
}
