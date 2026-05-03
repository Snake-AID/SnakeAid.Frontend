import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | SnakeAid',
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
