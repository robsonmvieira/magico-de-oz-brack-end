import { UuidVO } from '@modules/core/domain/valueObject'

export class LeadId extends UuidVO {
  constructor(value?: string) {
    super(value)
  }
}
