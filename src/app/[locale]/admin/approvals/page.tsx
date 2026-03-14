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
import { useState } from 'react';

const mockPendingUsers = [
  {
    id: 1,
    name: 'Nguyen Van Minh',
    email: 'nguyenvanminh@gmail.com',
    phone: '0912345678',
    role: 'Rescuer',
    location: 'Q.7, TP.HCM',
    registeredAt: '2026-01-25 14:30',
    experience: '5 nam kinh nghiem cuu ho dong vat hoang da',
    certification: 'Chung chi cuu ho cap 2',
  },
  {
    id: 2,
    name: 'Tran Thi Lan',
    email: 'tranthilan.expert@gmail.com',
    phone: '0987654321',
    role: 'Expert',
    location: 'Binh Thanh, TP.HCM',
    registeredAt: '2026-01-25 09:15',
    experience: 'Bac si thu y chuyen ve bo sat, 10 nam kinh nghiem',
    certification: 'Bang Thu y, Chung chi chuyen khoa bo sat',
  },
  {
    id: 3,
    name: 'Le Hoang Anh',
    email: 'lehoangan@rescue.vn',
    phone: '0901234567',
    role: 'Rescuer',
    location: 'Q.1, TP.HCM',
    registeredAt: '2026-01-24 16:45',
    experience: '3 nam trong doi cuu ho 115',
    certification: 'Chung chi so cap cuu, Chung chi leo nui',
  },
  {
    id: 4,
    name: 'Pham Minh Duc',
    email: 'phamminhduc.vet@yahoo.com',
    phone: '0976543210',
    role: 'Expert',
    location: 'Thu Duc, TP.HCM',
    registeredAt: '2026-01-24 11:20',
    experience: 'Nghien cuu sinh ve loai ran Viet Nam',
    certification: 'Thac si Sinh hoc, Nghien cuu vien tai Vien Sinh thai',
  },
];

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState(mockPendingUsers);
  const [selectedUser, setSelectedUser] = useState<(typeof mockPendingUsers)[0] | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | null;
    userId: number | null;
    userEmail: string;
  }>({ type: null, userId: null, userEmail: '' });

  const handleApproveClick = (userId: number, userEmail: string) => {
    setConfirmAction({ type: 'approve', userId, userEmail });
  };

  const handleRejectClick = (userId: number) => {
    setConfirmAction({ type: 'reject', userId, userEmail: '' });
  };

  const confirmApprove = () => {
    if (!confirmAction.userId) {
      return;
    }

    setPendingUsers(prev => prev.filter(u => u.id !== confirmAction.userId));
    setSelectedUser(null);
    setConfirmAction({ type: null, userId: null, userEmail: '' });
  };

  const confirmReject = () => {
    if (!confirmAction.userId) {
      return;
    }

    setPendingUsers(prev => prev.filter(u => u.id !== confirmAction.userId));
    setSelectedUser(null);
    setConfirmAction({ type: null, userId: null, userEmail: '' });
  };

  const cancelConfirm = () => {
    setConfirmAction({ type: null, userId: null, userEmail: '' });
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-gray-50/50 p-6 lg:p-8">
      <div className="mx-auto max-w-400">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold leading-tight text-gray-800">Phe duyet tai khoan</h2>
            <p className="text-sm text-gray-500">Quan ly yeu cau dang ky tu Rescuer va Expert</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">
                {pendingUsers.length}
                {' '}
                yeu cau cho xu ly
              </span>
            </div>
          </div>
        </header>

        {pendingUsers.length === 0
          ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center">
                <CheckCircle className="mb-4 size-16 text-green-500" />
                <h3 className="mb-2 text-xl font-bold text-gray-800">Khong co yeu cau nao dang cho</h3>
                <p className="text-gray-500">Tat ca yeu cau dang ky da duoc xu ly</p>
              </div>
            )
          : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {pendingUsers.map((user) => {
                  const isExpert = user.role === 'Expert';

                  return (
                    <div
                      key={user.id}
                      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-12 items-center justify-center rounded-full ${isExpert ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {isExpert ? <Shield className="size-6" /> : <UserCheck className="size-6" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{user.name}</h3>
                            <span className={`text-xs font-semibold ${isExpert ? 'text-blue-600' : 'text-green-600'}`}>{user.role}</span>
                          </div>
                        </div>
                      </div>

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

                      <div className="mb-4 rounded-lg bg-gray-50 p-3">
                        <p className="mb-1 text-xs font-semibold text-gray-700">Kinh nghiem:</p>
                        <p className="text-xs text-gray-600">{user.experience}</p>
                      </div>

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
                  );
                })}
              </div>
            )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex size-16 items-center justify-center rounded-full ${selectedUser.role === 'Expert' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {selectedUser.role === 'Expert' ? <Shield className="size-8" /> : <UserCheck className="size-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                  <span className={`text-sm font-semibold ${selectedUser.role === 'Expert' ? 'text-blue-600' : 'text-green-600'}`}>{selectedUser.role}</span>
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
                <p className="mb-2 text-sm font-semibold text-gray-700">Thong tin lien he</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-gray-400" />
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-gray-400" />
                    <span>{selectedUser.location}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Kinh nghiem</p>
                <p className="text-sm text-gray-600">{selectedUser.experience}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Chung chi</p>
                <p className="text-sm text-gray-600">{selectedUser.certification}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleRejectClick(selectedUser.id)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-all hover:bg-red-700"
              >
                Tu choi
              </button>
              <button
                type="button"
                onClick={() => handleApproveClick(selectedUser.id, selectedUser.email)}
                className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-all hover:bg-green-700"
              >
                Phe duyet
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction.type === 'approve' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800">Xac nhan phe duyet</h3>
            <p className="mt-2 text-sm text-gray-600">Ban co chac chan phe duyet tai khoan nay khong?</p>
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Email thong bao se gui den:
              {' '}
              {confirmAction.userEmail}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelConfirm}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
              >
                Xac nhan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction.type === 'reject' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800">Xac nhan tu choi</h3>
            <p className="mt-2 text-sm text-gray-600">Ban co chac chan tu choi tai khoan nay khong?</p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Hanh dong nay khong the hoan tac.
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelConfirm}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
              >
                Xac nhan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
