import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import { ThemeProvider } from '../providers/theme-provider';
import { QueryProvider } from '../providers/query-provider';
import { ToastProvider } from '../providers/toast-provider';
import { AuthProvider } from '../providers/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: 'OutlierX | AI-Powered Fraud & Anomaly Detection Platform',
  description:
    'OutlierX scans every transaction with AI and instantly highlights suspicious activity with plain-English explanations.',
  keywords: ['anomaly detection', 'fraud detection', 'AI fraud analytics', 'transaction analysis'],
  authors: [{ name: 'OutlierX Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                <div className="relative min-h-screen flex flex-col">{children}</div>
                <ToastProvider />
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
