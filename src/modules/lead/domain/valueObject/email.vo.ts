import { ValueObject } from '@modules/core/domain/valueObject'

export class EmailVO extends ValueObject {
  readonly value: string
  private constructor(value: string) {
    super()
    this.value = value
  }
  static create(value: string): EmailVO {
    if (!EmailVO.isValid(value)) {
      throw new Error('Invalid email')
    }
    return new EmailVO(value.toLowerCase().trim())
  }
  static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
}
