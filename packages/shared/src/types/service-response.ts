export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ok<T>(data: T): ServiceResponse<T> {
  return { success: true, data };
}

export function fail(error: string, statusCode = 500): ServiceResponse<never> {
  return { success: false, error, statusCode };
}
