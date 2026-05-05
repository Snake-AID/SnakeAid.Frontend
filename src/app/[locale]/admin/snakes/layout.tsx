import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loài rắn | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
