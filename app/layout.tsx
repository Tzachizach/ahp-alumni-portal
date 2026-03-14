import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'AHP Alumni Network',
  description: 'Accounting Honors Program Alumni Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ohio-gray-light text-ohio-gray-dark">
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
