import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import RoleRouteGuard from '@/components/auth/RoleRouteGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleRouteGuard allowedRole="Admin">
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminTopbar />
          {children}
        </div>
      </div>
    </RoleRouteGuard>
  );
}
