import AdminWithdrawalsPanel from '@/components/admin/AdminWithdrawalsPanel';

export default function AdminWithdrawalsPage() {
  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-360">
        <AdminWithdrawalsPanel />
      </div>
    </main>
  );
}
