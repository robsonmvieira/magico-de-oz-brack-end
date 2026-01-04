import { ValueObject } from '@modules/core/domain/valueObject'

export class PriorityVO extends ValueObject {
  readonly value: number
  constructor(value: number) {
    super()
    if (value < 1 || value > 5) {
      throw new Error('Priority must be between 1 and 5')
    }
    this.value = value
  }

  static create(value: number): PriorityVO {
    return new PriorityVO(value)
  }

  static low(): PriorityVO {
    return new PriorityVO(1)
  }
  static medium(): PriorityVO {
    return new PriorityVO(3)
  }
  static high(): PriorityVO {
    return new PriorityVO(5)
  }

  isHigherThan(other: PriorityVO): boolean {
    return this.value > other.value
  }
}
