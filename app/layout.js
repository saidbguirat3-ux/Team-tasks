import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/components/DataProvider';
import { Header, ErrorBanner } from '@/components/ui';

const display = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Team Task Hub',
  description: 'Shared, real-time task board for your teams',
};
export const viewport = { themeColor: '#4A5CF0' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-sans text-ink antialiased">
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
