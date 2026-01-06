type ModelOutputProps = {
  hasError: boolean
  data: any
  error?: any
  statusCode?: number
}

export class ModelCollectionOutput<T = any> {
  createdAt: Date
  hasError: boolean
  ok: boolean
  error: any
  data: T[]
  totalItems: number
  statusCode: number

  constructor({ hasError, data, error, statusCode = 200 }: ModelOutputProps) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.totalItems = data?.length ?? 0
    this.data = data
    this.error = error
    this.ok = !hasError
    this.statusCode = statusCode
  }
}
