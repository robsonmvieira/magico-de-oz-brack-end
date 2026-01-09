import { ValueObject } from '@modules/core/domain/valueObject'

export class PhoneVO extends ValueObject {
  readonly value: string
  private constructor(value: string) {
    super()
    this.value = value
  }
  static create(value: string): PhoneVO {
    if (!PhoneVO.isValid(value)) {
      throw new Error('Invalid phone number')
    }
    return new PhoneVO(value)
  }
  static isValid(value: string): boolean {
    const cleaned = value.replaceAll(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 13) {
      throw new Error('Invalid phone number')
    }
    return (
      /^(\d{2})(\d{5})(\d{4})$/.test(cleaned) ||
      /^(\d{2})(\d{4})(\d{4})$/.test(cleaned)
    )
  }
  formatted(): string {
    // Formato: (XX) XXXXX-XXXX
    return this.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}
