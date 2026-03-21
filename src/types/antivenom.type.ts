export interface Antivenom {
  id: number;
  name: string;
  manufacturer: string;
  description: string;
}

export interface AntivenomUpsertPayload {
  name: string;
  manufacturer: string;
  description: string;
}
