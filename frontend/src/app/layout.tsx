import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { MainLayout } from '@/components/layout/MainLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

// Display + UI face — technical, geometric, not a default.
const display = Space_Grotesk({
  subsets:  ['latin'],
  variable: '--font-display',
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});

// Every number, price, score, timestamp renders in this. The terminal voice.
const mono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-mono',
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title:       'Matchwise — AI-powered football predictions',
  description: 'AI-powered football predictions: match probabilities, market odds, and statistical analysis. Built by ZahTech LLC.',
  applicationName: 'Matchwise',
  openGraph: {
    title:       'Matchwise — AI-powered football predictions',
    description: 'AI-powered football predictions: match probabilities, market odds, and statistical analysis.',
    siteName:    'Matchwise',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Matchwise — AI-powered football predictions',
    description: 'AI-powered football predictions: match probabilities, market odds, and statistical analysis.',
  },
  keywords:    ['football', 'soccer', 'predictions', 'live scores', 'match analysis', 'Matchwise', 'ZahTech'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
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
