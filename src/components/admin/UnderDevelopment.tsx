'use client';

import { ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UnderDevelopmentPageProps {
  title: string;
  description: string;
  activeMenu: string;
}

export default function UnderDevelopmentPage({ title, description, activeMenu }: UnderDevelopmentPageProps) {
  const router = useRouter();
  const targetPath = activeMenu === 'dashboard' ? '/admin/dashboard' : `/admin/${activeMenu}`;

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-gray-50/50">
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-8 inline-flex size-32 items-center justify-center rounded-full bg-amber-100">
            <Construction className="size-16 text-amber-600" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-800">{title}</h1>
          <p className="mb-8 text-lg text-gray-600">{description}</p>
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-8 py-6 text-amber-800">
            <p className="text-sm font-semibold">🚧 Trang này đang trong quá trình phát triển</p>
            <p className="mt-2 text-sm">Chức năng sẽ được cập nhật trong phiên bản tiếp theo</p>
          </div>

          <button
            type="button"
            onClick={() => router.push(targetPath)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-800 hover:shadow-lg"
          >
            <ArrowLeft className="size-5" />
            <span>Quay về Dashboard</span>
          </button>
        </div>
      </div>
    </main>
  );
}
