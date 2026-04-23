export type SettingValueType = 'String' | 'Int' | 'Decimal' | 'Boolean' | 'Json';

export interface SystemSetting {
  settingKey: string;
  value: string;
  description?: string | null;
  valueType: SettingValueType;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSystemSettingRequest {
  value: string;
  valueType: SettingValueType;
  description?: string;
}

export interface ReloadSystemSettingKeyResult {
  key: string;
  exists: boolean;
}

export interface ReloadAllSystemSettingsResult {
  count: number;
}
