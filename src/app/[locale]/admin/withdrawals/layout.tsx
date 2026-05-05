import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rút tiền | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
