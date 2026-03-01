import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { MainLayout } from '@/components/layout/MainLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'BetAction — Sports Prediction Platform',
  description: 'Real-time football match predictions powered by AI and advanced statistics.',
  keywords:    ['football', 'soccer', 'predictions', 'live scores', 'betting'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <TooltipProvider delayDuration={300}>
          <MainLayout>
            {children}
          </MainLayout>
        </TooltipProvider>
      </body>
    </html>
  );
}
