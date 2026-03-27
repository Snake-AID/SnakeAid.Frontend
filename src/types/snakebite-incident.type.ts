import type { UserInfo } from './auth.type';
import type { BriefRescuerProfileResponse } from './operator.type';

export interface DetailSnakebiteIncidentResponse {
  id: string;
  locationCoordinates: GeoPointResponse;
  symptomsReport: ReportSymptom[] | null;
  status: SnakebiteIncidentStatus;
  assignedAt: string | null;
  assignedRescuerId: string | null;
  address: string | null;
  cancellationReason: string | null;
  severityLevel: number | null;
  incidentOccurredAt: string | null;
  identifiedSnake: SnakeSpeciesResponse | null;
  identificationContext: SnakeIdentificationContext | null;
  user: BriefMemberProfileResponse;
  assignedRescuer: BriefRescuerProfileResponse | null;
  activeMission: CreateRescueMissionResponse | null;
  totalRescueAttempts: number;
  failedAttemptsCount: number;
  media: SnakeAIDetectMediaResponse[];
}

export interface SnakeAIDetectMediaResponse {
  id: string;
  mediaUrl: string;
  referenceType: MediaReferenceType;
  purpose: MediaPurpose;
  isProcessed: boolean;
  processedAt: string | null;
  sequenceOrder: number | null;
  detectedSpecies: SnakeSpeciesResponse[];
}

export interface BriefMemberProfileResponse {
  accountId: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  rating: number;
  ratingCount: number;
  emergencyContacts: string[];
  hasUnderlyingDisease: boolean;
  account: UserInfo;
}

export interface GeoPointResponse {
  latitude: number;
  longitude: number;
}

export interface ReportSymptom {
  symptomId: number;
  symptomName: string;
  symptomDescription: string;
}

export interface SnakeIdentificationContext {
  method: SnakeIdentificationMethod;
  aIConfidence: number | null;
  identifiedAt: string;
}

export interface SnakeSpeciesResponse {
  id: number;
  scientificName: string;
  slug: string;
  commonName: string;
  imageUrl: string;
  description: string;
  identificationSummary: string;
  primaryVenomType: PrimaryVenomType | null;
  riskLevel: number;
  isVenomous: boolean;
  isActive: boolean;
}

export interface CreateRescueMissionResponse {
  id: string;
  incidentId: string;
  rescuerId: string;
  status: RescueMissionStatus;
  price: number;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  cancellationReason: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

export enum MediaReferenceType {
  CommunityReport = 'CommunityReport',
  SnakebiteIncident = 'SnakebiteIncident',
  RescueMission = 'RescueMission',
  SnakeCatchingRequest = 'SnakeCatchingRequest',
  SnakeCatchingMission = 'SnakeCatchingMission',
}

export enum MediaPurpose {
  Evidence = 'Evidence',
  SnakeIdentification = 'SnakeIdentification',
  LocationProof = 'LocationProof',
  InjuryPhoto = 'InjuryPhoto',
  BeforeAfter = 'BeforeAfter',
  SnakeOthers = 'SnakeOthers',
}

export enum SnakebiteIncidentStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Assigned = 'Assigned',
  FalseAlarm = 'FalseAlarm',
  Finished = 'Finished',
  Cancelled = 'Cancelled',
  NoRescuerFound = 'NoRescuerFound',
  Disputed = 'Disputed',
  Completed = 'Completed',
}

export enum SnakeIdentificationMethod {
  None = 'None',
  AIDetection = 'AIDetection',
  FilterQuestions = 'FilterQuestions',
  ManualByRescuer = 'ManualByRescuer',
  ExpertVerified = 'ExpertVerified',
}

export enum RescueMissionStatus {
  Preparing = 'Preparing',
  EnRoute = 'EnRoute',
  RescuerArrived = 'RescuerArrived',
  MissionCompleted = 'MissionCompleted',
  MissionUncompleted = 'MissionUncompleted',
  MissionAborted = 'MissionAborted',
  Cancelled = 'Cancelled',
}

export enum PrimaryVenomType {
  Neurotoxic = 'Neurotoxic',
  Hemotoxic = 'Hemotoxic',
  Cytotoxic = 'Cytotoxic',
  Myotoxic = 'Myotoxic',
  None = 'None',
}

export interface CreateIncidentResponse {
  id: string;
  userId: string;
  locationCoordinates: GeoPointResponse;
  status: SnakebiteIncidentStatus;
  address: string | null;
  incidentOccurredAt: string | null;
  dispatchRequestId: string | null;
  dispatchedRescuerId: string | null;
}

export interface DispatchIncidentRequest {
  rescuerId: string;
}

export interface MarkFalseAlarmRequest {
  reason?: string;
}

export interface ReportNoAnswerRequest {
  continueCalling: boolean;
  note?: string;
}

export enum DispatchRequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Declined = 'Declined',
  Cancelled = 'Cancelled',
}

export interface DispatchRequestItem {
  requestId: string;
  rescuerId: string;
  rescuerName: string;
  rescuerPhone: string;
  status: DispatchRequestStatus;
  createdAt: string;
  responseAt: string | null;
  declineReason?: string | null;
}
