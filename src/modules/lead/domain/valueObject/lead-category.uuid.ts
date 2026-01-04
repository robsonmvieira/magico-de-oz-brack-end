import { UuidVO } from '@modules/core/domain/valueObject'

export class LeadCategoryId extends UuidVO {
  constructor(value?: string) {
    super(value)
  }
}
