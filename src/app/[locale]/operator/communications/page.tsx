'use client';

import { MessageSquare, PhoneCall, Send, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

type ChatChannel = 'rescuers' | 'reporters' | 'internal';

interface ChatThread {
  id: number;
  incidentCode: string;
  title: string;
  channel: ChatChannel;
  lastMessage: string;
  updatedAt: string;
  unread: number;
  online: boolean;
}

interface ChatMessage {
  id: number;
  by: 'operator' | 'rescuer' | 'reporter';
  content: string;
  at: string;
}

const threads: ChatThread[] = [
  {
    id: 1,
    incidentCode: 'INC-240315-017',
    title: 'Đội cứu hộ A',
    channel: 'rescuers',
    lastMessage: 'Đã tới gần hiện trường, còn khoảng 4 phút.',
    updatedAt: '09:31',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    incidentCode: 'INC-240315-014',
    title: 'Người báo tin - Trần Gia Bảo',
    channel: 'reporters',
    lastMessage: 'Đã gửi thêm ảnh hiện trường qua Zalo.',
    updatedAt: '09:25',
    unread: 1,
    online: true,
  },
  {
    id: 3,
    incidentCode: 'INC-240315-009',
    title: 'Nội bộ ca trực',
    channel: 'internal',
    lastMessage: 'Cần backup đội gần Bình Thạnh.',
    updatedAt: '09:12',
    unread: 0,
    online: false,
  },
];

const messagesByThread: Record<number, ChatMessage[]> = {
  1: [
    { id: 1, by: 'operator', content: 'Xác nhận đã nhận lệnh cho INC-240315-017 chưa?', at: '09:27' },
    { id: 2, by: 'rescuer', content: 'Đã nhận lệnh, đang di chuyển theo tuyến Nguyen Thi Thap.', at: '09:28' },
    { id: 3, by: 'rescuer', content: 'Đã tới gần hiện trường, còn khoảng 4 phút.', at: '09:31' },
  ],
  2: [
    { id: 1, by: 'operator', content: 'Anh/chị giữ khoảng cách an toàn và không tự xử lý.', at: '09:22' },
    { id: 2, by: 'reporter', content: 'Đã gửi thêm ảnh hiện trường qua Zalo.', at: '09:25' },
  ],
  3: [
    { id: 1, by: 'operator', content: 'Case Bình Thạnh có cần thêm đội gần nhất không?', at: '09:09' },
    { id: 2, by: 'operator', content: 'Cần backup đội gần Bình Thạnh.', at: '09:12' },
  ],
};

const channelLabel: Record<ChatChannel, string> = {
  rescuers: 'Đội cứu hộ',
  reporters: 'Người báo tin',
  internal: 'Nội bộ',
};

export default function OperatorCommunicationsPage() {
  const [activeThreadId, setActiveThreadId] = useState<number>(threads[0]?.id ?? 0);
  const [draft, setDraft] = useState('');

  const activeThread = useMemo(
    () => threads.find(item => item.id === activeThreadId) ?? threads[0],
    [activeThreadId],
  );

  const activeMessages = activeThread ? (messagesByThread[activeThread.id] ?? []) : [];

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/80">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-6">
        <section className="rounded-3xl border border-teal-200/60 bg-linear-to-r from-teal-900 via-teal-800 to-teal-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">Liên lạc thời gian thực</p>
              <h1 className="mt-2 text-3xl font-bold">Trung tâm Chat điều phối</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-50/90">
                Kênh chat tập trung giữa điều phối viên, đội cứu hộ và người báo tin theo từng mã sự cố.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-105">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đoạn chat mở</p>
                <p className="mt-1 text-2xl font-bold">{threads.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Tin chưa đọc</p>
                <p className="mt-1 text-2xl font-bold">{threads.reduce((sum, item) => sum + item.unread, 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đang trực tuyến</p>
                <p className="mt-1 text-2xl font-bold">{threads.filter(item => item.online).length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Danh sách hội thoại</h2>
              </div>
              <div className="max-h-[calc(100vh-270px)] space-y-3 overflow-y-auto p-4">
                {threads.map((thread) => {
                  const isActive = thread.id === activeThread?.id;

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{thread.incidentCode}</p>
                        <span className="text-xs font-medium text-slate-500">{thread.updatedAt}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{thread.title}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{thread.lastMessage}</p>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {channelLabel[thread.channel]}
                        </span>
                        {thread.unread > 0 && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            {thread.unread}
                            {' tin mới'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {activeThread
                ? (
                    <>
                      <div className="border-b border-slate-200 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900">{activeThread.incidentCode}</h2>
                            <p className="mt-1 text-sm text-slate-600">{activeThread.title}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                <MessageSquare className="size-3.5" />
                                {channelLabel[activeThread.channel]}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 font-semibold text-teal-700">
                                <ShieldCheck className="size-3.5" />
                                Đồng bộ theo mã sự cố
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                          >
                            <PhoneCall className="size-4" />
                            Gọi nhanh
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[calc(100vh-430px)] space-y-3 overflow-y-auto bg-slate-50/60 p-5">
                        {activeMessages.map(message => (
                          <div
                            key={message.id}
                            className={`max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              message.by === 'operator'
                                ? 'ml-auto bg-teal-700 text-white'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            <p>{message.content}</p>
                            <div className={`mt-2 text-[11px] ${message.by === 'operator' ? 'text-teal-100' : 'text-slate-400'}`}>
                              {message.at}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200 p-4">
                        <div className="flex items-end gap-3">
                          <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-300">
                            <label htmlFor="chat-draft" className="sr-only">Nội dung chat</label>
                            <textarea
                              id="chat-draft"
                              value={draft}
                              onChange={event => setDraft(event.target.value)}
                              rows={3}
                              placeholder="Nhập nội dung hướng dẫn đội cứu hộ hoặc phản hồi người báo tin..."
                              className="w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setDraft('')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                          >
                            <Send className="size-4" />
                            Gửi
                          </button>
                        </div>
                      </div>
                    </>
                  )
                : (
                    <div className="px-6 py-10 text-center">
                      <UserRound className="mx-auto size-8 text-slate-400" />
                      <p className="mt-3 text-sm text-slate-600">Chưa có hội thoại nào để hiển thị.</p>
                    </div>
                  )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
