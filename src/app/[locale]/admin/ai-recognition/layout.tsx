import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhận diện AI | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
