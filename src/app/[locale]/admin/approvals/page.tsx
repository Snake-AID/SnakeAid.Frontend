'use client';

import {
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mock data for pending approvals
const mockPendingUsers = [
  {
    id: 1,
    name: 'Nguyễn Văn Minh',
    email: 'nguyenvanminh@gmail.com',
    phone: '0912345678',
    role: 'Rescuer',
    location: 'Q.7, TP.HCM',
    registeredAt: '2026-01-25 14:30',
    experience: '5 năm kinh nghiệm cứu hộ động vật hoang dã',
    certification: 'Chứng chỉ cứu hộ cấp 2',
    status: 'pending',
  },
  {
    id: 2,
    name: 'Trần Thị Lan',
    email: 'tranthilan.expert@gmail.com',
    phone: '0987654321',
    role: 'Expert',
    location: 'Bình Thạnh, TP.HCM',
    registeredAt: '2026-01-25 09:15',
    experience: 'Bác sĩ thú y chuyên về bò sát, 10 năm kinh nghiệm',
    certification: 'Bằng Thú y, Chứng chỉ chuyên khoa bò sát',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Lê Hoàng Anh',
    email: 'lehoangan@rescue.vn',
    phone: '0901234567',
    role: 'Rescuer',
    location: 'Q.1, TP.HCM',
    registeredAt: '2026-01-24 16:45',
    experience: '3 năm trong đội cứu hộ 115',
    certification: 'Chứng chỉ sơ cấp cứu, Chứng chỉ leo núi',
    status: 'pending',
  },
  {
    id: 4,
    name: 'Phạm Minh Đức',
    email: 'phamminhduc.vet@yahoo.com',
    phone: '0976543210',
    role: 'Expert',
    location: 'Thủ Đức, TP.HCM',
    registeredAt: '2026-01-24 11:20',
    experience: 'Nghiên cứu sinh về loài rắn Việt Nam',
    certification: 'Thạc sĩ Sinh học, Nghiên cứu viên tại Viện Sinh thái',
    status: 'pending',
  },
];

export default function ApprovalsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [pendingUsers, setPendingUsers] = useState(mockPendingUsers);
  const [selectedUser, setSelectedUser] = useState<
    (typeof mockPendingUsers)[0] | null
  >(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | null;
    userId: number | null;
    userEmail: string;
  }>({ type: null, userId: null, userEmail: '' });

  useEffect(() => {
    // Check authentication status
    // This is a valid use case for setting state in useEffect for authentication check
    /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
    const checkAuth = () => {
      const authenticated = localStorage.getItem('admin_authenticated');
      const email = localStorage.getItem('admin_email');

      if (authenticated === 'true' && email) {
        setIsAuthenticated(true);
        setAdminEmail(email);
        setIsLoading(false);
      } else {
        router.push('/admin/login');
      }
    };

    checkAuth();
    /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */
  }, [router, setIsAuthenticated, setAdminEmail, setIsLoading]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_email');
    router.push('/admin/login');
  };

  const handleApproveClick = (userId: number, userEmail: string) => {
    setConfirmAction({ type: 'approve', userId, userEmail });
  };

  const handleRejectClick = (userId: number) => {
    setConfirmAction({ type: 'reject', userId, userEmail: '' });
  };

  const confirmApprove = () => {
    if (confirmAction.userId) {
      // In real app, call API to approve user and send email
      setPendingUsers(prev => prev.filter(u => u.id !== confirmAction.userId));
      setSelectedUser(null);
      setConfirmAction({ type: null, userId: null, userEmail: '' });
      // Show success notification
    }
  };

  const confirmReject = () => {
    if (confirmAction.userId) {
      // In real app, call API to reject user
      setPendingUsers(prev => prev.filter(u => u.id !== confirmAction.userId));
      setSelectedUser(null);
      setConfirmAction({ type: null, userId: null, userEmail: '' });
      // Show notification
    }
  };

  const cancelConfirm = () => {
    setConfirmAction({ type: null, userId: null, userEmail: '' });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="mx-auto mb-4 size-16 animate-spin text-green-600" />
          <p className="font-medium text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar
        activeMenu="approvals"
        adminEmail={adminEmail}
        onLogout={handleLogout}
      />

      <main className="flex h-full flex-1 flex-col overflow-hidden bg-gray-50/50">
        {/* Header */}
        <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-gray-200/60 bg-white px-8">
          <div className="flex flex-col">
            <h2 className="text-[32px] font-bold leading-tight text-gray-800">
              Phê duyệt tài khoản
            </h2>
            <p className="text-sm text-gray-500">
              Quản lý yêu cầu đăng ký từ Rescuer & Expert
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">
                  {pendingUsers.length}
                  {' '}
                  yêu cầu chờ xử lý
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-400">
            {pendingUsers.length === 0
              ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center">
                    <CheckCircle className="mb-4 size-16 text-green-500" />
                    <h3 className="mb-2 text-xl font-bold text-gray-800">
                      Không có yêu cầu nào đang chờ
                    </h3>
                    <p className="text-gray-500">
                      Tất cả yêu cầu đăng ký đã được xử lý
                    </p>
                  </div>
                )
              : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {pendingUsers.map(user => (
                      <div
                        key={user.id}
                        className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
                      >
                        {/* Header */}
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-12 items-center justify-center rounded-full ${
                                user.role === 'Expert'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-green-100 text-green-600'
                              }`}
                            >
                              {user.role === 'Expert'
                                ? (
                                    <Shield className="size-6" />
                                  )
                                : (
                                    <UserCheck className="size-6" />
                                  )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">
                                {user.name}
                              </h3>
                              <span
                                className={`text-xs font-semibold ${
                                  user.role === 'Expert'
                                    ? 'text-blue-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="mb-4 flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="size-4 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="size-4 text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="size-4 text-gray-400" />
                            <span>{user.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="size-4 text-gray-400" />
                            <span>{user.registeredAt}</span>
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                          <p className="mb-1 text-xs font-semibold text-gray-700">
                            Kinh nghiệm:
                          </p>
                          <p className="text-xs text-gray-600">{user.experience}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                          >
                            <User className="mx-auto size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveClick(user.id, user.email)}
                            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700"
                          >
                            <CheckCircle className="mx-auto size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClick(user.id)}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700"
                          >
                            <X className="mx-auto size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-16 items-center justify-center rounded-full ${
                    selectedUser.role === 'Expert'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {selectedUser.role === 'Expert'
                    ? (
                        <Shield className="size-8" />
                      )
                    : (
                        <UserCheck className="size-8" />
                      )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedUser.name}
                  </h2>
                  <span
                    className={`text-sm font-semibold ${
                      selectedUser.role === 'Expert'
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}
                  >
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Thông tin liên hệ
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4 text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="size-4 text-gray-400" />
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="size-4 text-gray-400" />
                    <span>{selectedUser.location}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Kinh nghiệm
                </p>
                <p className="text-sm text-gray-600">
                  {selectedUser.experience}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Chứng chỉ
                </p>
                <p className="text-sm text-gray-600">
                  {selectedUser.certification}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Thời gian đăng ký
                    </p>
                    <p className="text-xs text-amber-700">
                      {selectedUser.registeredAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleRejectClick(selectedUser.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-700"
              >
                <X className="size-5" />
                <span>Từ chối</span>
              </button>
              <button
                type="button"
                onClick={() => handleApproveClick(selectedUser.id, selectedUser.email)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700"
              >
                <CheckCircle className="size-5" />
                <span>Phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmAction.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            {confirmAction.type === 'approve'
              ? (
                  <>
                    <div className="mb-6 text-center">
                      <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="size-8 text-green-600" />
                      </div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        Xác nhận phê duyệt
                      </h2>
                      <p className="text-gray-600">
                        Bạn có chắc chắn muốn phê duyệt tài khoản này?
                      </p>
                    </div>

                    {/* Email notification section */}
                    <div className="mb-6">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Mail className="size-5 text-blue-600" />
                          <p className="text-sm font-semibold text-blue-800">
                            Email thông báo sẽ được gửi đến:
                          </p>
                        </div>
                        <p className="text-sm font-medium text-blue-700">
                          {confirmAction.userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={cancelConfirm}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={confirmApprove}
                        className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700"
                      >
                        Xác nhận phê duyệt
                      </button>
                    </div>
                  </>
                )
              : (
                  <>
                    <div className="mb-6 text-center">
                      <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-full bg-red-100">
                        <X className="size-8 text-red-600" />
                      </div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        Xác nhận từ chối
                      </h2>
                      <p className="text-gray-600">
                        Bạn có chắc chắn muốn từ chối tài khoản này?
                      </p>
                    </div>

                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm text-amber-800">
                        ⚠️ Hành động này không thể hoàn tác. Người dùng sẽ không thể
                        truy cập vào hệ thống.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={cancelConfirm}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={confirmReject}
                        className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-700"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  </>
                )}
          </div>
        </div>
      )}
    </div>
  );
}
