import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  // Default — individual routes override via per-route layout.tsx.
  title: {
    default: 'AHP Alumni Network',
    template: '%s · AHP Alumni',
  },
  description: 'Accounting Honors Program Alumni Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ohio-gray-light text-ohio-gray-dark">
        <SessionProvider>
          {children}
          {/*
            Configure react-hot-toast for screen readers (WCAG 4.1.3 — Status messages).
            Successes announce politely; errors announce assertively.
          */}
          <Toaster
            position="top-right"
            toastOptions={{
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
              error: {
                ariaProps: {
                  role: 'alert',
                  'aria-live': 'assertive',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
