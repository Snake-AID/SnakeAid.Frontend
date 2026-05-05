export type PolicyRole = 'MEMBER' | 'RESCUER' | 'EXPERT';

export type PolicyType = 'USER_GUIDE' | 'PRIVACY_POLICY' | 'PAYMENT_POLICY' | 'TERMS' | 'FAQ' | 'CONTACT_SUPPORT';

export interface PolicySection {
  id: string;
  order: number;
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  bulletPoints?: string[];
  content?: string; // For longer text or table-like content if needed
}

export interface Policy {
  id: string;
  role: PolicyRole;
  type: PolicyType;
  title: string;
  version: string;
  lastUpdated: string;
  isPublished: boolean;
  sections: PolicySection[];
}

export interface UpsertPolicyRequest {
  title: string;
  version: string;
  isPublished: boolean;
  sections: PolicySection[];
}
