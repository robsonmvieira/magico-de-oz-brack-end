import { v4 as uuidV4, validate as uuidValidate } from 'uuid'
import { ValueObject } from './'
import { UuidException } from '../exceptions'

export class UuidVO extends ValueObject {
  readonly id: string
  constructor(value?: string) {
    super()
    this.id = value || uuidV4()
    this.validate()
  }

  public static create(): UuidVO {
    return new UuidVO(uuidV4())
  }

  public validate(): boolean {
    const isValid = uuidValidate(this.id)

    if (!isValid) {
      throw new UuidException('Invalid uuid')
    }
    return isValid
  }

  toString(): string {
    return this.id
  }
}
