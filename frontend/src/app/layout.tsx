import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import { MainLayout } from '@/components/layout/MainLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

// Display + UI face — technical, geometric, not a default.
const display = localFont({
  src: '../assets/fonts/SpaceGrotesk-Variable.woff2',
  variable: '--font-display',
  display:  'swap',
  weight: '100 900',
  style: 'normal',
});

// Every number, price, score, timestamp renders in this. The terminal voice.
const mono = localFont({
  src: '../assets/fonts/JetBrainsMono-Variable.woff2',
  variable: '--font-mono',
  display:  'swap',
  weight: '100 800',
  style: 'normal',
});

export const metadata: Metadata = {
  title:       'MatchWise - AI-powered football predictions',
  description: 'AI-powered football predictions: match probabilities, model-implied price, and statistical analysis. Built by ZahTech LLC.',
  applicationName: 'MatchWise',
  icons: {
    icon: '/brand/favicon.svg',
    shortcut: '/brand/favicon.svg',
    apple: '/brand/matchwise-mark.svg',
  },
  openGraph: {
    title:       'MatchWise - AI-powered football predictions',
    description: 'AI-powered football predictions: match probabilities, model-implied price, and statistical analysis.',
    siteName:    'MatchWise',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'MatchWise - AI-powered football predictions',
    description: 'AI-powered football predictions: match probabilities, model-implied price, and statistical analysis.',
  },
  keywords:    ['football', 'soccer', 'predictions', 'live scores', 'match analysis', 'MatchWise', 'ZahTech'],
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



