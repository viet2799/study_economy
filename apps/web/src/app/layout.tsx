import './styles.css';

import { ReactNode } from 'react';

export const metadata = {
  title: 'Studybase',
  description: 'Base project with NestJS and NextJS'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
