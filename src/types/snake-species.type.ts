export type PrimaryVenomType = 'Neurotoxic' | 'Hemotoxic' | 'Cytotoxic' | 'Myotoxic' | 'None' | string;

export interface SnakeSpeciesIdentification {
  physicalTraits: string[];
  behaviors: string[];
  habitat: string | null;
}

export interface SnakeSpeciesSymptomByTime {
  timeRange: string;
  signs: string[];
  isCritical: boolean;
}

export interface FirstAidLineItem {
  text: string;
  mediaUrl: string | null;
}

export interface FirstAidGuidelineContent {
  steps: FirstAidLineItem[];
  dos: FirstAidLineItem[];
  donts: FirstAidLineItem[];
  notes: string[];
}

export interface FirstAidGuidelineOverride {
  mode: 'Replace' | 'Append' | string;
  content: FirstAidGuidelineContent;
}

export interface SnakeVenomInfo {
  venomType: string;
  description: string;
}

export interface SnakeAntivenomInfo {
  antivenomName: string;
  manufacturer?: string | null;
  effectiveness?: string | null;
}

export interface SnakeSpeciesSummary {
  id: number;
  scientificName: string;
  slug: string;
  commonName: string;
  imageUrl: string;
  mediaId?: string | null;
  description: string;
  identificationSummary: string;
  primaryVenomType: PrimaryVenomType | null;
  identification: SnakeSpeciesIdentification | null;
  symptomsByTime: SnakeSpeciesSymptomByTime[] | null;
  firstAidGuidelineOverride: FirstAidGuidelineOverride | null;
  riskLevel: number;
  isVenomous: boolean;
  isActive: boolean;
}

export interface SnakeSpeciesDetail extends SnakeSpeciesSummary {
  alternativeNames: string[];
  venoms: SnakeVenomInfo[];
  antivenoms: Array<SnakeVenomInfo | SnakeAntivenomInfo>;
  venomIds?: number[];
  antivenomIds?: number[];
}

export interface SnakeSpeciesUpsertPayload {
  scientificName: string;
  commonName: string;
  mediaId: string;
  description: string;
  identificationSummary: string;
  primaryVenomType: PrimaryVenomType | null;
  identification: SnakeSpeciesIdentification;
  symptomsByTime: SnakeSpeciesSymptomByTime[];
  firstAidGuidelineOverride: FirstAidGuidelineOverride | null;
  riskLevel: number;
  isVenomous: boolean;
  isActive: boolean;
  venomIds: number[];
  antivenomIds: number[];
  alternativeNames: string[];
}
