type PaginatedOutputProps<T> = {
  data: T[]
  totalItems: number
  page: number
  limit: number
  hasError?: boolean
  error?: any
  statusCode?: number
}

export class PaginatedOutput<T = any> {
  createdAt: Date
  hasError: boolean
  ok: boolean
  error: any
  data: T[]
  statusCode: number

  // Pagination metadata
  totalItems: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean

  constructor({
    data,
    totalItems,
    page,
    limit,
    hasError = false,
    error = null,
    statusCode = 200
  }: PaginatedOutputProps<T>) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.ok = !hasError
    this.error = error
    this.data = data
    this.statusCode = statusCode

    // Pagination
    this.totalItems = totalItems
    this.page = page
    this.limit = limit
    this.totalPages = Math.ceil(totalItems / limit)
    this.hasNextPage = page < this.totalPages
    this.hasPreviousPage = page > 1
  }

  static error<T>(error: any, statusCode: number = 500): PaginatedOutput<T> {
    return new PaginatedOutput<T>({
      data: [],
      totalItems: 0,
      page: 1,
      limit: 10,
      hasError: true,
      error: { message: [error.message || 'Internal server error'] },
      statusCode
    })
  }
}
