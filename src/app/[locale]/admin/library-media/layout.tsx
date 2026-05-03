import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thư viện Media | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
