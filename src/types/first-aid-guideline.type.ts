export interface FirstAidGuidelineLineItem {
  text: string;
  mediaUrl: string | null;
}

export interface FirstAidGuidelineContent {
  steps: FirstAidGuidelineLineItem[];
  dos: FirstAidGuidelineLineItem[];
  donts: FirstAidGuidelineLineItem[];
  notes: string[];
}

export interface FirstAidGuideline {
  id: number;
  name: string;
  content: FirstAidGuidelineContent;
  type: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirstAidGuidelineOption {
  id: number;
  label: string;
}
