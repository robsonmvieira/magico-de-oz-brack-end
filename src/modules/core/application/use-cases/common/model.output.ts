type ModelOutputProps = {
  hasError: boolean
  data: any
  error?: any
}

export class ModelOutput<T = null> {
  createdAt: Date
  hasError: boolean
  ok: boolean
  error: any
  data: T

  constructor({ hasError, data, error }: ModelOutputProps) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.data = data
    this.error = error
    this.ok = !hasError
  }
}
