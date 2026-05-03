import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cơ sở điều trị | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
