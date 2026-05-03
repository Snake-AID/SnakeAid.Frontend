import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Xét duyệt | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
