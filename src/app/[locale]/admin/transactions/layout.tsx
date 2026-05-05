import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giao dịch | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
