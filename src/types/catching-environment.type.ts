export interface CatchingEnvironment {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
}

export interface CatchingEnvironmentUpsertPayload {
  name: string;
  description: string;
  price: number;
  currency: string;
}
