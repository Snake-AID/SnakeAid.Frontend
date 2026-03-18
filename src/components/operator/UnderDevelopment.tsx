'use client';

import { ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OperatorUnderDevelopmentProps {
  title: string;
  description: string;
}

export default function OperatorUnderDevelopment({ title, description }: OperatorUnderDevelopmentProps) {
  const router = useRouter();

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/70">
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-8 inline-flex size-32 items-center justify-center rounded-full bg-teal-100">
            <Construction className="size-16 text-teal-700" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-800">{title}</h1>
          <p className="mb-8 text-lg text-slate-600">{description}</p>
          <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-8 py-6 text-teal-800">
            <p className="text-sm font-semibold">Trang nay dang trong qua trinh phat trien</p>
            <p className="mt-2 text-sm">Chuc nang se duoc cap nhat trong phien ban tiep theo</p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/operator/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white transition-all hover:bg-teal-800 hover:shadow-lg"
          >
            <ArrowLeft className="size-5" />
            <span>Quay về tổng quan</span>
          </button>
        </div>
      </div>
    </main>
  );
}
