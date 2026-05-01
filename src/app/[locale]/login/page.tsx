'use client';

import type { UserRole } from '@/types/auth.type';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Lock,
  LogIn,
  ShieldUser,
  UserCog,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { authApi } from '@/apis/auth.api';
import { cn } from '@/utils';
import {
  bootstrapAuthSession,
  clearAuthSession,
  getAuthSessionServerSnapshot,
  getAuthSessionSnapshot,
  getRoleHomePath,
  isRoleAllowed,
  subscribeAuthSession,
  syncLegacyAdminKeys,
} from '@/utils/auth-session';

const roleConfig: Record<UserRole, {
  title: string;
  description: string;
  icon: typeof ShieldUser;
  selectedClass: string;
}> = {
  Admin: {
    title: 'Admin Portal',
    description: 'Quản trị hệ thống, dữ liệu và báo cáo',
    icon: ShieldUser,
    selectedClass: 'border-blue-300 bg-blue-50 text-blue-900',
  },
  Operator: {
    title: 'Operator Portal',
    description: 'Điều phối sự cố và theo dõi realtime',
    icon: UserCog,
    selectedClass: 'border-teal-300 bg-teal-50 text-teal-900',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionServerSnapshot,
  );
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedColorClass = useMemo(() => {
    if (!selectedRole) {
      return 'focus:border-slate-500 focus:ring-slate-500/20';
    }

    return selectedRole === 'Admin'
      ? 'focus:border-blue-600 focus:ring-blue-600/20'
      : 'focus:border-teal-600 focus:ring-teal-600/20';
  }, [selectedRole]);

  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  useEffect(() => {
    if (session.isBootstrapping) {
      return;
    }

    if (session.isAuthenticated && session.role) {
      router.replace(getRoleHomePath(session.role));
    }
  }, [router, session.isAuthenticated, session.isBootstrapping, session.role]);

  if (session.isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="size-5 animate-spin text-slate-600" />
          <p className="text-sm font-medium text-slate-700">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Vui lòng chọn role trước khi đăng nhập.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      clearAuthSession();

      const response = await authApi.login({
        email,
        password,
        role: selectedRole,
      });

      if (!isRoleAllowed(response.user.role, selectedRole)) {
        clearAuthSession();
        setError(`Tài khoản không thuộc role ${selectedRole}. Vui lòng chọn đúng role và thử lại.`);
        return;
      }

      syncLegacyAdminKeys(response.user);
      router.replace(getRoleHomePath(selectedRole));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.16),transparent_40%)]" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="grid md:grid-cols-2">
          <section className="relative overflow-hidden bg-linear-to-br from-green-950 via-green-900 to-black p-8 text-white md:p-10">
            <div className="absolute -top-14 -right-14 size-52 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 size-60 rounded-full bg-green-300/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex size-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md">
                  <img
                    src="/assets/snakeaid_logo.png"
                    alt="SnakeAid Logo"
                    className="size-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-sm font-bold text-slate-800">SA</span>';
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-200">SnakeAid</p>
                  <p className="text-sm font-medium text-white/90">Admin & Operator Web</p>
                </div>
              </div>

              <h1 className="mt-8 text-3xl leading-tight font-bold md:text-4xl">
                Cổng Điều Hành
                <br />
                SnakeAid Control Center
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
                Hệ thống dành cho đội vận hành và quản trị, tập trung vào xử lý sự cố,
                điều phối cứu hộ, theo dõi bản đồ realtime và kiểm soát dữ liệu toàn nền tảng.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-green-300/20 bg-green-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-200">Admin Portal</p>
                  <p className="mt-1 text-sm text-slate-100">Quản trị người dùng, dữ liệu hệ thống, tài chính và báo cáo.</p>
                </div>
                <div className="rounded-xl border border-green-300/20 bg-green-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-200">Operator Portal</p>
                  <p className="mt-1 text-sm text-slate-100">Tiếp nhận ca trực, xác minh nhanh và điều phối hiện trường.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 md:p-10">
            {!selectedRole
              ? (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Chọn Role Truy Cập</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Nhấn vào role để chuyển sang bước đăng nhập
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                      {(['Admin', 'Operator'] as UserRole[]).map((role) => {
                        const config = roleConfig[role];
                        const Icon = config.icon;

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setSelectedRole(role);
                              setError('');
                            }}
                            className={cn(
                              'group rounded-2xl border px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
                              role === 'Admin'
                                ? 'border-blue-200 bg-blue-50/70 hover:border-blue-300'
                                : 'border-teal-200 bg-teal-50/70 hover:border-teal-300',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'rounded-lg p-2.5',
                                  role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800',
                                )}
                              >
                                <Icon className="size-5" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-slate-900">{config.title}</p>
                                <p className="mt-0.5 text-sm text-slate-600">{config.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              : (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Đăng nhập vào</p>
                        <h2 className="text-2xl font-bold text-slate-900">{roleConfig[selectedRole].title}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(null);
                          setError('');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <ArrowLeft className="size-4" />
                        Đổi role
                      </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                      {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className={cn(
                            'w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 outline-none transition-all',
                            selectedColorClass,
                          )}
                          placeholder="management@gmail.com"
                          autoComplete="email"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                          Mật khẩu
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={cn(
                              'w-full rounded-xl border border-slate-300 py-3 pr-4 pl-11 text-slate-700 outline-none transition-all',
                              selectedColorClass,
                            )}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                          'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60',
                          selectedRole === 'Admin'
                            ? 'bg-[#305b9c] hover:bg-[#1f395f]'
                            : 'bg-teal-700 hover:bg-teal-800',
                        )}
                      >
                        {isLoading
                          ? (
                              <>
                                <Loader2 className="size-5 animate-spin" />
                                <span>Đang đăng nhập...</span>
                              </>
                            )
                          : (
                              <>
                                <LogIn className="size-5" />
                                <span>Đăng nhập</span>
                              </>
                            )}
                      </button>
                    </form>
                  </div>
                )}
          </section>
        </div>
      </div>
    </div>
  );
}
