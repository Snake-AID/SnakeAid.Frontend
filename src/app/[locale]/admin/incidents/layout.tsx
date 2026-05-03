import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sự cố rắn cắn | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
