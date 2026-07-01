import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '../providers/theme-provider';
import { QueryProvider } from '../providers/query-provider';
import { ToastProvider } from '../providers/toast-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Anomalyze | Enterprise Financial Anomaly Detection SaaS',
  description:
    'Secure, AI-powered real-time transaction monitoring and anomaly detection platform for modern organizations.',
  keywords: ['anomaly detection', 'fraud prevention', 'financial analytics', 'SaaS', 'transaction analysis'],
  authors: [{ name: 'Anomalyze Team' }],
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative min-h-screen flex flex-col">
              {children}
            </div>
            <ToastProvider />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
