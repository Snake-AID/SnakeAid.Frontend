import type { PaginationMeta } from './api-response';

export interface ReportMediaResponse {
  id: string;
  mediaUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  referenceType: string | number;
  purpose: string | number;
  requiresAIProcessing: boolean;
}

export interface ExpertCertificateResponse {
  id: string;
  expertId: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  media: ReportMediaResponse[];
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason: string | null;
}

export interface AdminCreateExpertCertificateRequest {
  expertId: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  reportMediaIds: string[];
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason?: string | null;
}

export interface AdminUpdateExpertCertificateRequest {
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  reportMediaIds: string[];
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason?: string | null;
}

export interface PaginatedExpertCertificates {
  items: ExpertCertificateResponse[];
  meta: PaginationMeta;
}
