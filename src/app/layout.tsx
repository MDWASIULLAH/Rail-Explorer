import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationHeader from '@/components/ui/NavigationHeader';
import Footer from '@/components/ui/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Indian Railway 3D Explorer',
  description: 'Explore Indian trains in 3D. View coach compositions, find your berth, compare coaches, and calculate distances.',
  keywords: ['Indian Railways', '3D train', 'coach composition', 'berth finder', 'PNR status'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <NavigationHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
