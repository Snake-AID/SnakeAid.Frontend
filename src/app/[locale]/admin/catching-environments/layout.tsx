import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Môi trường bắt rắn | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
