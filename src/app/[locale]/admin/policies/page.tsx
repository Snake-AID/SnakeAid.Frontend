'use client';

import type { Policy, PolicyRole, PolicySection, PolicyType } from '@/types/policy.type';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { policyApi } from '@/apis/policy.api';
import { useToast } from '@/components/ToastProvider';

const ROLE_OPTIONS: Array<{ value: PolicyRole; label: string; icon: any }> = [
  { value: 'MEMBER', label: 'Member', icon: User },
  { value: 'RESCUER', label: 'Rescuer', icon: Shield },
  { value: 'EXPERT', label: 'Expert', icon: Stethoscope },
];

const TYPE_LABELS: Record<PolicyType, string> = {
  USER_GUIDE: 'Hướng dẫn sử dụng',
  PRIVACY_POLICY: 'Chính sách bảo mật',
  PAYMENT_POLICY: 'Chính sách thanh toán',
  TERMS: 'Điều khoản & Điều kiện',
  FAQ: 'Câu hỏi thường gặp',
  CONTACT_SUPPORT: 'Liên hệ hỗ trợ',
};

export default function PoliciesPage() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<PolicyRole>('MEMBER');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await policyApi.getAll();
      setPolicies(data);
      if (data.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(data.find(p => p.role === selectedRoleId)?.id || (data[0]?.id ?? null));
      }
    } catch {
      showToast('Không thể tải danh sách điều khoản', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId, selectedPolicyId, showToast]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => p.role === selectedRoleId
      && (p.title.toLowerCase().includes(searchTerm.toLowerCase())
        || TYPE_LABELS[p.type].toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [policies, selectedRoleId, searchTerm]);

  const selectedPolicy = useMemo(() => {
    return policies.find(p => p.id === selectedPolicyId) || null;
  }, [policies, selectedPolicyId]);

  const handleStartEdit = () => {
    if (selectedPolicy) {
      setEditData(JSON.parse(JSON.stringify(selectedPolicy)));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData) {
      return;
    }
    setSaving(true);
    try {
      const updated = await policyApi.upsert(editData.id, editData.role, editData.type, {
        title: editData.title,
        version: editData.version,
        isPublished: editData.isPublished,
        sections: editData.sections,
      });
      setPolicies(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setIsEditing(false);
      showToast('Đã lưu thay đổi thành công', { type: 'success' });
    } catch {
      showToast('Lỗi khi lưu điều khoản', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    if (!editData) {
      return;
    }
    const newSection: PolicySection = {
      id: `new-${Date.now()}`,
      order: editData.sections.length + 1,
      title: 'Tiêu đề mục mới',
      description: '',
      bulletPoints: [],
    };
    setEditData({
      ...editData,
      sections: [...editData.sections, newSection],
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!editData) {
      return;
    }
    setEditData({
      ...editData,
      sections: editData.sections.filter(s => s.id !== sectionId),
    });
  };

  const handleUpdateSection = (sectionId: string, field: keyof PolicySection, value: any) => {
    if (!editData) {
      return;
    }
    setEditData({
      ...editData,
      sections: editData.sections.map(s => (s.id === sectionId ? { ...s, [field]: value } : s)),
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!editData) {
      return;
    }
    const newSections = [...editData.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) {
      return;
    }

    const itemA = newSections[index];
    const itemB = newSections[targetIndex];

    if (itemA && itemB) {
      newSections[index] = itemB;
      newSections[targetIndex] = itemA;
    }

    // Update orders
    const updatedSections = newSections.map((s, i) => ({ ...s, order: i + 1 }));
    setEditData({ ...editData, sections: updatedSections });
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-[#f8fafc] p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quản lý điều khoản & chính sách</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cấu hình nội dung hướng dẫn, bảo mật và thanh toán cho các ứng dụng mobile.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void loadPolicies()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar Area */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Role Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex flex-col gap-1">
                {ROLE_OPTIONS.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRoleId === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRoleId(role.value)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`size-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Policy List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chính sách..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-2">
                {loading
                  ? (
                      <div className="flex flex-col items-center py-8 text-slate-400">
                        <Loader2 className="size-8 animate-spin mb-2" />
                        <span className="text-xs">Đang tải dữ liệu...</span>
                      </div>
                    )
                  : filteredPolicies.length > 0
                    ? (
                        filteredPolicies.map(policy => (
                          <button
                            key={policy.id}
                            type="button"
                            onClick={() => setSelectedPolicyId(policy.id)}
                            className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                              selectedPolicyId === policy.id
                                ? 'border-blue-200 bg-blue-50 shadow-sm'
                                : 'border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-lg p-2 ${selectedPolicyId === policy.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <FileText className="size-4" />
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${selectedPolicyId === policy.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                  {TYPE_LABELS[policy.type]}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  v
                                  {policy.version}
                                  {' '}
                                  •
                                  {' '}
                                  {policy.lastUpdated}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`size-4 transition ${selectedPolicyId === policy.id ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                          </button>
                        ))
                      )
                    : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-slate-400">Không tìm thấy chính sách nào</p>
                        </div>
                      )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9">
            {!selectedPolicy
              ? (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="rounded-full bg-slate-50 p-4">
                      <FileText className="size-12 text-slate-200" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa chọn chính sách</h3>
                    <p className="mt-2 text-sm text-slate-500">Chọn một chính sách từ danh sách bên trái để xem và chỉnh sửa nội dung.</p>
                  </div>
                )
              : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Policy Header */}
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200">
                            <ShieldCheck className="size-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900">{TYPE_LABELS[selectedPolicy.type]}</h3>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                                {selectedPolicy.role}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">
                              Phiên bản
                              {' '}
                              {selectedPolicy.version}
                              {' '}
                              • Cập nhật cuối:
                              {' '}
                              {selectedPolicy.lastUpdated}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing
                            ? (
                                <button
                                  type="button"
                                  onClick={handleStartEdit}
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700"
                                >
                                  Chỉnh sửa nội dung
                                </button>
                              )
                            : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    Hủy bỏ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                    Lưu thay đổi
                                  </button>
                                </>
                              )}
                        </div>
                      </div>
                    </div>

                    {/* Policy Sections */}
                    <div className="p-6">
                      {isEditing
                        ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Tiêu đề hiển thị
                                    <input
                                      type="text"
                                      value={editData?.title || ''}
                                      onChange={e => setEditData(prev => (prev ? { ...prev, title: e.target.value } : null))}
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-normal outline-none focus:border-blue-500"
                                    />
                                  </label>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Phiên bản
                                    <input
                                      type="text"
                                      value={editData?.version || ''}
                                      onChange={e => setEditData(prev => (prev ? { ...prev, version: e.target.value } : null))}
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-normal outline-none focus:border-blue-500"
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                    Các mục nội dung (
                                    {editData?.sections.length}
                                    )
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={handleAddSection}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    <Plus className="size-4" />
                                    Thêm mục mới
                                  </button>
                                </div>

                                {editData?.sections.map((section, index) => (
                                  <div key={section.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200">
                                    <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSection(index, 'up')}
                                        disabled={index === 0}
                                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 disabled:opacity-30 hover:text-blue-600"
                                      >
                                        <ChevronUp className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSection(index, 'down')}
                                        disabled={index === (editData.sections.length - 1)}
                                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 disabled:opacity-30 hover:text-blue-600"
                                      >
                                        <ChevronDown className="size-3" />
                                      </button>
                                    </div>

                                    <div className="mb-4 flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          value={section.title}
                                          onChange={e => handleUpdateSection(section.id, 'title', e.target.value)}
                                          placeholder="Tiêu đề mục"
                                          className="w-full border-b border-transparent pb-1 text-base font-bold text-slate-800 outline-none hover:border-slate-200 focus:border-blue-500"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSection(section.id)}
                                        className="p-1 text-slate-300 transition hover:text-rose-500"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                          Mô tả ngắn
                                          <textarea
                                            value={section.description || ''}
                                            onChange={e => handleUpdateSection(section.id, 'description', e.target.value)}
                                            rows={2}
                                            className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm font-normal outline-none focus:bg-white focus:border-blue-300"
                                          />
                                        </label>
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                          Nội dung chi tiết (Bullet points)
                                          <textarea
                                            value={section.bulletPoints?.join('\n') || ''}
                                            onChange={e => handleUpdateSection(section.id, 'bulletPoints', e.target.value.split('\n'))}
                                            placeholder="Nhập mỗi dòng là một ý..."
                                            rows={4}
                                            className="mt-1 w-full font-mono rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm font-normal outline-none focus:bg-white focus:border-blue-300"
                                          />
                                        </label>
                                      </div>

                                      {section.content && (
                                        <div>
                                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                            Nội dung tự do (Markdown/HTML)
                                            <textarea
                                              value={section.content || ''}
                                              onChange={e => handleUpdateSection(section.id, 'content', e.target.value)}
                                              rows={4}
                                              className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm font-normal outline-none focus:bg-white focus:border-blue-300"
                                            />
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        : (
                            <div className="space-y-8">
                              {selectedPolicy.sections.sort((a, b) => a.order - b.order).map(section => (
                                <div key={section.id} className="relative pl-6">
                                  <div className="absolute left-0 top-1.5 h-full w-0.5 bg-slate-100" />
                                  <div className="absolute left-[-4px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />

                                  <h4 className="text-lg font-bold text-slate-800">{section.title}</h4>
                                  {section.description && (
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.description}</p>
                                  )}

                                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                                    <ul className="mt-4 space-y-3">
                                      {section.bulletPoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                                          <span>{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}

                                  {section.content && (
                                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                                      {section.content}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>
    </main>
  );
}
