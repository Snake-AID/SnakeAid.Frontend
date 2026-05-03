import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cấu hình triệu chứng | SnakeAid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
