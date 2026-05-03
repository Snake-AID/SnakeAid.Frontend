import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài chính | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
