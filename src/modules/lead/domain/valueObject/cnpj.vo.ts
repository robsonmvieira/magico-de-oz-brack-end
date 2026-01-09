import { ValueObject } from '@modules/core/domain/valueObject'

// VO para dados CNPJ
export type PartnerProps = {
  name: string
  qualification: string
}

export type CnpjDataProps = {
  cnpj: string
  businessName: string
  openingDate?: Date
  capital?: number // capital social
  businessNature?: string
  partners?: Array<PartnerProps>
}
export class CnpjDataVO extends ValueObject {
  readonly cnpj: string
  readonly businessName: string
  readonly openingDate?: Date
  readonly capital?: number
  readonly businessNature?: string
  readonly partners?: Array<PartnerProps>
  private constructor({
    cnpj,
    businessName,
    openingDate,
    capital,
    businessNature,
    partners
  }: CnpjDataProps) {
    super()
    this.cnpj = cnpj
    this.businessName = businessName
    this.openingDate = openingDate
    this.capital = capital
    this.businessNature = businessNature
    this.partners = partners
  }

  static create(props: CnpjDataProps): CnpjDataVO {
    if (!CnpjDataVO.isValid(props.cnpj)) {
      throw new Error('Invalid CNPJ')
    }
    return new CnpjDataVO(props)
  }

  static isValid(cnpj: string): boolean {
    const cleaned = cnpj.replaceAll(/\D/g, '')

    if (cleaned.length !== 14) return false

    // Rejeita CNPJs com todos os dígitos iguais
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Calcula o primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(cleaned[i]) * weights1[i]
    }
    let remainder = sum % 11
    const firstDigit = remainder < 2 ? 0 : 11 - remainder

    if (firstDigit !== Number.parseInt(cleaned[12])) return false

    // Calcula o segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += Number.parseInt(cleaned[i]) * weights2[i]
    }
    remainder = sum % 11
    const secondDigit = remainder < 2 ? 0 : 11 - remainder

    return secondDigit === Number.parseInt(cleaned[13])
  }

  yearsInBusiness(): number {
    if (!this.openingDate) return 0
    const now = new Date()
    return Math.floor(
      (now.getTime() - this.openingDate.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    )
  }

  formatted(): string {
    return this.cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    )
  }
}
