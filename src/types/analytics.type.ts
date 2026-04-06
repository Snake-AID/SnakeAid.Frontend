// ─── Users analytics ─────────────────────────────────────────────────────────

export interface UserTimelinePoint {
  label: string;
  totalUsers: number;
}

export interface UsersAnalytics {
  from: string;
  to: string;
  period: string;
  totalUsers: number;
  timeline: UserTimelinePoint[];
}

// ─── Cases analytics ─────────────────────────────────────────────────────────

export interface CaseTimelinePoint {
  label: string;
  totalCases: number;
  snakebiteCases: number;
  snakeCatchingCases: number;
}

export interface CasesAnalytics {
  from: string;
  to: string;
  period: string;
  totalCases: number;
  snakebiteCases: number;
  snakeCatchingCases: number;
  timeline: CaseTimelinePoint[];
}

// ─── Revenue analytics ───────────────────────────────────────────────────────

export interface RevenueTimelinePoint {
  label: string;
  total: number;
  consultation: number;
  catching: number;
  snakebite: number;
}

export interface RevenueAnalytics {
  from: string;
  to: string;
  period: string;
  currency: string;
  total: number;
  byFlow: {
    consultation: number;
    catching: number;
    snakebite: number;
  };
  timeline: RevenueTimelinePoint[];
}

// ─── Commission analytics ─────────────────────────────────────────────────────

export interface CommissionTimelinePoint {
  label: string;
  revenue: number;
  expertPayout: number;
  refund: number;
  commission: number;
}

export interface CommissionAnalytics {
  from: string;
  to: string;
  period: string;
  currency: string;
  totalCommission: number;
  rateNote: string;
  timeline: CommissionTimelinePoint[];
}

// ─── Profit analytics ────────────────────────────────────────────────────────

export interface ProfitTimelinePoint {
  label: string;
  totalProfit: number;
  consultation: number;
  catching: number;
  snakebite: number;
}

export interface ProfitAnalytics {
  from: string;
  to: string;
  period: string;
  currency: string;
  totalProfit: number;
  byFlow: {
    consultation: number;
    catching: number;
    snakebite: number;
  };
  timeline: ProfitTimelinePoint[];
}

// ─── Query params ─────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'day' | 'month' | 'year';

export interface AnalyticsParams {
  period: AnalyticsPeriod;
  from: string;
  to: string;
}

// ─── Recent incidents ─────────────────────────────────────────────────────────

export interface RecentIncidentItem {
  id: string;
  status: string;
  createdAt: string;
  address: string;
  assignedRescuerId: string | null;
  activeMissionStatus: string | null;
  needsRedispatch: boolean;
  handlingOperatorId: string | null;
  locationCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface RecentIncidentsResponse {
  items: RecentIncidentItem[];
  totalCount?: number;
}

// ─── Recent catching requests ────────────────────────────────────────────────

export interface RecentCatchingRequestItem {
  id: string;
  address: string;
  status: string;
  priority: string;
  requestDate: string;
  user: {
    account: {
      fullName: string;
      email: string;
    };
  } | null;
  assignedRescuer: {
    account: {
      fullName: string;
    };
  } | null;
  details: Array<{
    snakeSpeciesName: string;
    quantity: number;
  }>;
}
