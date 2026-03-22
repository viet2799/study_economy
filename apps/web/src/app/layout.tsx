import './styles.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'Studybase Commerce',
  description: 'Next.js base for ecommerce catalog, cart, checkout and auth.'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
