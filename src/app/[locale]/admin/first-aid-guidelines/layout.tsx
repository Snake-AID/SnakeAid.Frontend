import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hướng dẫn sơ cứu | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
