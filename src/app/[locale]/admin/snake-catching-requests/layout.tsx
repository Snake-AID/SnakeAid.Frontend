import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yêu cầu bắt rắn | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
