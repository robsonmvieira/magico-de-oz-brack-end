export type SortOrder = 'asc' | 'desc'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  totalItems: number
  page: number
  limit: number
}
