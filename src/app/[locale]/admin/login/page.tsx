'use client';

import { AlertTriangle, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Testing mode: Accept any credentials
    localStorage.setItem('admin_authenticated', 'true');
    localStorage.setItem('admin_email', email);

    // Redirect to admin dashboard
    router.push('/admin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-green-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg">
            <img
              src="/assets/images/logo/SnakeAidLogo.png"
              alt="SnakeAid Logo"
              className="h-full w-full object-contain p-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML
                  = '<span class="text-5xl">🏥</span>';
              }}
            />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">SnakeAid Admin</h1>
          <p className="text-gray-500">Đăng nhập vào trang quản trị</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="size-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-700 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                  placeholder="admin@snakeaid.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-700 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="font-semibold text-green-600 hover:text-green-700">
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Đang xử lý...</span>
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

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2026 SnakeAid. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
