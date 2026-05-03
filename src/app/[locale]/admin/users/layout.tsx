import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Người dùng | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
