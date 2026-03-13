export interface ApiResponse<T> {
  status_code: number;
  message: string;
  is_success: boolean;
  data: T | null;
  error: ClientErrorResponse | null;
}

export interface ClientErrorResponse {
  errorCode: string | null;
  timestamp: string;
  validationErrors: { [key: string]: string[] } | null;
}
