import './globals.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'JV Restaurant – Restaurant Management System',
  description:
    'Complete restaurant management system with customer ordering, kitchen display, table management and cash billing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
