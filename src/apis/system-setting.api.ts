import type {
  ReloadAllSystemSettingsResult,
  ReloadSystemSettingKeyResult,
  SystemSetting,
  UpsertSystemSettingRequest,
} from '@/types/system-setting.type';
import { api } from './client';

const encodeSettingKey = (key: string) => encodeURIComponent(key.trim());

export const systemSettingApi = {
  getAll: () => api.get<SystemSetting[]>('/admin/system-settings'),

  getByKey: (key: string) => api.get<SystemSetting>(`/admin/system-settings/${encodeSettingKey(key)}`),

  upsert: (key: string, payload: UpsertSystemSettingRequest) =>
    api.put<SystemSetting>(`/admin/system-settings/${encodeSettingKey(key)}`, payload),

  reloadKey: (key: string) =>
    api.post<ReloadSystemSettingKeyResult>(`/admin/system-settings/reload/${encodeSettingKey(key)}`),

  reloadAll: () => api.post<ReloadAllSystemSettingsResult>('/admin/system-settings/reload-all'),
};
