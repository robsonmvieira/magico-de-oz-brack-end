import { UuidVO } from '@modules/core/domain/valueObject'

export class LocationId extends UuidVO {
  constructor(value?: string) {
    super(value)
  }
}
