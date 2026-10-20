import type { Metadata, Viewport } from 'next';
import { Archivo, Abril_Fatface, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

/* --- Typography (DESIGN_SYSTEM.md §2) --- */
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'ApexCross (汇护通) — Cross-Border Tuition Payment Agent',
  description:
    'Autonomous, compliance-first cross-border financial agent that parses university tuition invoices, optimizes multi-currency FX remittance corridors across APEC economies, and securely executes bank-grade wires under FIDO2/WebAuthn biometric guardrails.',
  applicationName: 'ApexCross',
  keywords: [
    'cross-border payments',
    'tuition remittance',
    'FX corridor optimization',
    'WebAuthn FIDO2',
    'international students',
    'APEC',
  ],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ApexCross (汇护通)',
    description: 'Autonomous cross-border tuition payment agent with biometric wire authorization.',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#07191E',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Theme bootstrap script — applies persisted theme before paint to prevent flash.
 * Key: apexcross-theme (DESIGN_SYSTEM.md §8.4)
 */
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('apexcross-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${abrilFatface.variable} ${ibmPlexMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-abyss font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
