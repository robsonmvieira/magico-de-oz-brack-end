type ModelOutputProps = {
  hasError: boolean
  data: any
  error?: any
  statusCode?: number
}

export class ModelOutput<T = null> {
  createdAt: Date
  hasError: boolean
  ok: boolean
  error: any
  data: T
  statusCode: number

  constructor({ hasError, data, error, statusCode = 200 }: ModelOutputProps) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.data = data
    this.error = error
    this.ok = !hasError
    this.statusCode = statusCode
  }
}
