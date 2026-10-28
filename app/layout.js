import { Inter } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/components/DataProvider';
import { Header, ErrorBanner } from '@/components/ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Team Task Hub',
  description: 'Shared, real-time task board for your teams',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-800 antialiased`}>
        <DataProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <ErrorBanner />
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
