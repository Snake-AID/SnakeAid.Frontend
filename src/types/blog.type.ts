export type BlogStatus = 'Draft' | 'PendingApproval' | 'Published' | 'Rejected';

export type BlogCategory
  = | 'SnakeKnowledge'
    | 'SnakeSpecies'
    | 'SnakeHealth'
    | 'SnakeFeeding'
    | 'SnakeHabitat'
    | 'Other';

export type BlogTag
  = | 'Venomous'
    | 'NonVenomous'
    | 'Safety'
    | 'WildSnake'
    | 'SnakeCare'
    | 'SnakeBehavior'
    | 'SnakeIdentification'
    | 'SnakeConservation'
    | 'SnakeMyths'
    | 'Other';

export interface BlogAccount {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
}

export interface BlogSummary {
  id: string;
  authorId: string;
  /** Author info returned as `account` from the API */
  account: BlogAccount | null;
  title: string;
  thumbnailUrl: string;
  category: BlogCategory;
  tags: BlogTag[];
  viewCount: number;
  likeCount: number;
  readingTime: number;
  status: BlogStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDetail extends BlogSummary {
  content: string;
  likedViewer: string[];
}

export interface BlogUpsertPayload {
  title: string;
  content: string;
  thumbnailUrl: string;
  status: BlogStatus;
  category: BlogCategory;
  tags: BlogTag[];
  readingTime: number;
}

export interface BlogStatusUpdatePayload {
  status: BlogStatus;
  rejectionReason?: string;
}

export const BLOG_STATUS_LABEL: Record<BlogStatus, string> = {
  Draft: 'Bản nháp',
  PendingApproval: 'Chờ duyệt',
  Published: 'Đã đăng',
  Rejected: 'Bị từ chối',
};

export const BLOG_CATEGORY_LABEL: Record<BlogCategory, string> = {
  SnakeKnowledge: 'Kiến thức rắn',
  SnakeSpecies: 'Loài rắn',
  SnakeHealth: 'Sức khỏe rắn',
  SnakeFeeding: 'Nuôi rắn',
  SnakeHabitat: 'Môi trường sống',
  Other: 'Khác',
};

export const BLOG_TAG_LABEL: Record<BlogTag, string> = {
  Venomous: 'Có độc',
  NonVenomous: 'Không độc',
  Safety: 'An toàn',
  WildSnake: 'Rắn hoang dã',
  SnakeCare: 'Chăm sóc rắn',
  SnakeBehavior: 'Hành vi rắn',
  SnakeIdentification: 'Nhận dạng rắn',
  SnakeConservation: 'Bảo tồn',
  SnakeMyths: 'Lầm tưởng',
  Other: 'Khác',
};
