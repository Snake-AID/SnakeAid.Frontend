import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý lịch làm việc | SnakeAid',
};

export default function WorkshiftsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
