export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export type { PaginatedData, PaginationMetadata } from './pagination';
