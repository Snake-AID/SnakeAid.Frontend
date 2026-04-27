export type FirstAidGuidelineType = 'General' | 'VenomSpecific' | string;

export interface FirstAidGuidelineLineItem {
  text: string;
  mediaUrl: string | null;
}

export interface FirstAidGuidelineDraftLineItem extends FirstAidGuidelineLineItem {
  mediaId: string | null;
}

export interface FirstAidGuidelineContent {
  steps: FirstAidGuidelineLineItem[];
  dos: FirstAidGuidelineLineItem[];
  donts: FirstAidGuidelineLineItem[];
  notes: string[];
}

export interface FirstAidGuidelineDraftContent {
  steps: FirstAidGuidelineDraftLineItem[];
  dos: FirstAidGuidelineDraftLineItem[];
  donts: FirstAidGuidelineDraftLineItem[];
  notes: string[];
}

export interface FirstAidGuideline {
  id: number;
  name: string;
  content: FirstAidGuidelineContent;
  type: FirstAidGuidelineType;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirstAidGuidelineOption {
  id: number;
  label: string;
}

export interface FirstAidGuidelineListParams {
  name?: string;
  type?: FirstAidGuidelineType;
  pageNumber?: number;
  pageSize?: number;
}

export interface FirstAidGuidelineListResult {
  items: FirstAidGuideline[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FirstAidGuidelineUpsertPayload {
  name: string;
  content: FirstAidGuidelineDraftContent;
  type: FirstAidGuidelineType;
  summary: string | null;
}

export type UpdateFirstAidGuidelinePayload = Partial<FirstAidGuidelineUpsertPayload>;
