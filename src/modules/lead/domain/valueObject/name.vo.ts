import { ValueObject } from '@modules/core/domain/valueObject'

export class NameVO extends ValueObject {
  readonly value: string
  constructor(value: string) {
    super()
    const trimmed = value.trim()
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new Error('CategoryName must be between 2 and 100 characters')
    }
    this.value = trimmed
  }

  static create(value: string): NameVO {
    return new NameVO(value)
  }
}
