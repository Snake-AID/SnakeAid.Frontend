export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Failed';

export interface AdminWithdrawalItem {
  id: string;
  userId: string;
  amount: number;
  bankAccount: string;
  bankName: string;
  accountHolderName: string;
  bankBin: string | null;
  status: WithdrawalStatus;
  processedAt: string | null;
  rejectionReason: string | null;
  vietQrPayload: string | null;
  vietQrImageBase64: string | null;
  createdAt: string;
  processedByAdminId: string | null;
  adminNotes: string | null;
}

export interface ApproveWithdrawalRequest {
  adminNotes?: string;
}

export interface RejectWithdrawalRequest {
  reason: string;
  adminNotes?: string;
}

export interface CompleteWithdrawalRequest {
  adminNotes?: string;
}

export interface FailWithdrawalRequest {
  reason: string;
  adminNotes?: string;
}
