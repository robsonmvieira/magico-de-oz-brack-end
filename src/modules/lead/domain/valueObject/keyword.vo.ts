import { ValueObject } from '@modules/core/domain/valueObject'

export class KeywordVO extends ValueObject {
  readonly value: string
  constructor(value: string) {
    super()
    const trimmed = value.trim().toLowerCase()
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new Error('Keyword must be between 2 and 50 characters')
    }
    this.value = trimmed
  }

  static create(value: string): KeywordVO {
    return new KeywordVO(value.trim().toLowerCase())
  }

  matches(text: string): boolean {
    return text.toLowerCase().includes(this.value)
  }
}
