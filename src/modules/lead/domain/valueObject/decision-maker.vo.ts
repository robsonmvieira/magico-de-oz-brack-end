import { ValueObject } from '@modules/core/domain/valueObject'
import { EmailVO } from './email.vo'
import { PhoneVO } from './phone.vo'

// VO para decisor (contato)
export type DecisionMakerProps = {
  name: string
  role: string
  email?: string
  phone?: string
  linkedinUrl?: string
  source: 'apollo' | 'hunter' | 'linkedin' | 'manual'
  isPrimary?: boolean
}
export class DecisionMakerVO extends ValueObject {
  readonly name: string
  readonly role: string
  readonly email?: EmailVO
  readonly phone?: PhoneVO
  readonly linkedinUrl?: string
  readonly source: 'apollo' | 'hunter' | 'linkedin' | 'manual'
  readonly isPrimary?: boolean
  private constructor({
    name,
    role,
    email,
    phone,
    linkedinUrl,
    source,
    isPrimary
  }: DecisionMakerProps) {
    super()
    this.name = name
    this.role = role
    this.email = email ? EmailVO.create(email) : undefined
    this.phone = phone ? PhoneVO.create(phone) : undefined
    this.linkedinUrl = linkedinUrl
    this.source = source
    this.isPrimary = isPrimary ?? false
  }

  static create({
    name,
    role,
    email,
    phone,
    linkedinUrl,
    source,
    isPrimary
  }: DecisionMakerProps): DecisionMakerVO {
    return new DecisionMakerVO({
      name,
      role,
      email,
      phone,
      linkedinUrl,
      source,
      isPrimary
    })
  }

  hasContactInfo(): boolean {
    return !!this.email || !!this.phone
  }
}
