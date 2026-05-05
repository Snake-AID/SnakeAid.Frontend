import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cài đặt | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
