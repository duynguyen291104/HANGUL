import type { Metadata } from 'next';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'HANGUL',
  description: 'Tactile Korean learning experience with lessons, practice, arena, and writing tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
