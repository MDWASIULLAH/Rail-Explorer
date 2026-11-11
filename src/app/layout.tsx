import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationHeader from '@/components/ui/NavigationHeader';
import Footer from '@/components/ui/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { StarredTrainsProvider } from '@/context/StarredTrainsContext';
import { SeatSwapProvider } from '@/context/SeatSwapContext';
import StarredTrainsDrawer from '@/components/ui/StarredTrainsDrawer';
import StationAlarmModal from '@/components/ui/StationAlarmModal';
import EmergencySosModal from '@/components/ui/EmergencySosModal';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://railexplorer.vercel.app'),
  title: 'Indian Railway 3D Explorer | Live Tracking & Coach Visualizer',
  description:
    'Explore Indian trains in 3D. Real-time satellite GPS running status, live speedometer, station passing kilometers, coach compositions, and berth locators.',
  keywords: [
    'Indian Railways',
    '3D train',
    'coach composition',
    'berth finder',
    'PNR status',
    'live train running status',
    'railexplorer',
  ],
  alternates: {
    canonical: 'https://railexplorer.vercel.app',
  },
  openGraph: {
    title: 'Indian Railway 3D Explorer | Live Tracking & Coach Visualizer',
    description:
      'Real-time satellite GPS running status, live speedometer, station passing kilometers, and interactive 3D coach exploration.',
    url: 'https://railexplorer.vercel.app',
    siteName: 'Rail Explorer',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <AuthProvider>
          <StarredTrainsProvider>
            <SeatSwapProvider>
              <NavigationHeader />
              <main className="flex-1">{children}</main>
              <Footer />
              <StarredTrainsDrawer />
              <StationAlarmModal />
              <EmergencySosModal />
            </SeatSwapProvider>
          </StarredTrainsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
