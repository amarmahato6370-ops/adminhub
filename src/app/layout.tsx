import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Adminhub',
  description: 'Production-ready administration platform for maxi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
