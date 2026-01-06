type ModelOutputProps = {
  hasError: boolean
  data: any
  error?: any
}

export class ModelCollectionOutput<T = any> {
  createdAt: Date
  hasError: boolean
  ok: boolean
  error: any
  data: T[]
  totalItems: number

  constructor({ hasError, data, error }: ModelOutputProps) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.totalItems = data.length
    this.data = data
    this.error = error
    this.ok = !hasError
  }
}
