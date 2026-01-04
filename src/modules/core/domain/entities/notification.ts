export class Notification {
  errors = new Map<string, string[] | string>()

  addError(error: string, field?: string) {
    if (field) {
      const collection = (this.errors.get(field) ?? []) as string[]
      collection.indexOf(error) === -1 && collection.push(error)
      this.errors.set(field, collection)
    } else {
      this.errors.set(error, error)
    }
  }

  setErrors(errors: string | string[], field?: string) {
    if (field) {
      this.errors.set(field, Array.isArray(errors) ? errors : [errors])
    } else {
      if (Array.isArray(errors)) {
        errors.forEach(error => this.addError(error))
      } else {
        this.addError(errors)
      }
    }
  }

  copyErrors(notification: Notification) {
    this.errors = new Map(notification.errors)
  }

  getErrors() {
    return this.errors
  }

  count() {
    return this.errors.size
  }

  hasError() {
    return this.count() > 0
  }

  toJSON() {
    const errors: Array<string | { [key: string]: string[] }> = []
    this.errors.forEach((value, key) => {
      if (Array.isArray(value)) {
        errors.push({ [key]: value })
      } else {
        errors.push(value)
      }
    })
    return errors
  }
}
