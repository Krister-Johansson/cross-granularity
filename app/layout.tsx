import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { TimeSeriesProvider } from '@/lib/timeSeriesContext';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Loader2 } from 'lucide-react';
import { ReactNode, Suspense } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Time Series Explorer',
  description: 'Explore time series data',
};

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="h-12 w-12 animate-spin" />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyTitle>Loading Time Series Explorer</EmptyTitle>
        <EmptyDescription>
          Initializing your data visualization experience...
        </EmptyDescription>
      </Empty>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<LoadingFallback />}>
            <TimeSeriesProvider>{children}</TimeSeriesProvider>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
