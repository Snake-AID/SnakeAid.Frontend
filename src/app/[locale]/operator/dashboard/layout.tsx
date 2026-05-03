import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operator Dashboard | SnakeAid',
};

export default function OperatorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
