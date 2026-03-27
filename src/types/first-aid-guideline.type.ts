export interface FirstAidGuideline {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface FirstAidGuidelineOption {
  id: number;
  label: string;
}
