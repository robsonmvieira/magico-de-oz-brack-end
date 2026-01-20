import { ValueObject } from '@modules/core/domain/valueObject'

export class PhoneVO extends ValueObject {
  readonly value: string
  private constructor(value: string) {
    super()
    this.value = value
  }

  /**
   * Normaliza o telefone removendo código do país e caracteres não numéricos
   * Exemplos:
   * - "+55 11 99999-9999" -> "11999999999"
   * - "(11) 99999-9999" -> "11999999999"
   * - "5511999999999" -> "11999999999"
   */
  private static normalize(value: string): string {
    let cleaned = value.replaceAll(/\D/g, '')

    // Remove código do país brasileiro (55) se presente
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      cleaned = cleaned.slice(2)
    } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
      cleaned = cleaned.slice(2)
    }

    return cleaned
  }

  static create(value: string): PhoneVO {
    const normalized = PhoneVO.normalize(value)
    if (!PhoneVO.isValid(normalized)) {
      throw new Error('Invalid phone number')
    }
    return new PhoneVO(normalized)
  }

  static isValid(value: string): boolean {
    // Já deve estar normalizado (apenas dígitos, sem código do país)
    if (value.length < 10 || value.length > 11) {
      return false
    }
    // Celular brasileiro: 11 dígitos (DDD + 9 + 8 dígitos)
    // Fixo brasileiro: 10 dígitos (DDD + 8 dígitos)
    return (
      /^(\d{2})(\d{5})(\d{4})$/.test(value) ||
      /^(\d{2})(\d{4})(\d{4})$/.test(value)
    )
  }

  formatted(): string {
    // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (this.value.length === 11) {
      return this.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return this.value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
}
