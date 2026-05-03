import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loại nọc độc | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
