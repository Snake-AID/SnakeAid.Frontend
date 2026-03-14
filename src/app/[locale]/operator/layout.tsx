import RoleRouteGuard from '@/components/auth/RoleRouteGuard';
import OperatorSidebar from '@/components/operator/OperatorSidebar';
import OperatorTopbar from '@/components/operator/OperatorTopbar';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleRouteGuard allowedRole="Operator">
      <div className="flex min-h-screen bg-slate-50">
        <OperatorSidebar />
        <div className="min-w-0 flex-1">
          <OperatorTopbar />
          {children}
        </div>
      </div>
    </RoleRouteGuard>
  );
}
