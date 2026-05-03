import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tư vấn | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
