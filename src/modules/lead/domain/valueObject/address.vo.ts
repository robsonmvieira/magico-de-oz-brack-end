import { ValueObject } from '@modules/core/domain/valueObject'

export interface AddressProps {
  street: string
  city: string
  state: string
  zipCode?: string
  neighborhood?: string
  latitude?: number
  longitude?: number
}

export class AddressVO extends ValueObject {
  readonly value: AddressProps
  private constructor(value: AddressProps) {
    super()
    this.value = value
  }

  static create(value: AddressProps): AddressVO {
    return new AddressVO(value)
  }
}
