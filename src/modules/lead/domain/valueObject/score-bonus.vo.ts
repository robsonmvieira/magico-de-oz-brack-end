import { ValueObject } from '@modules/core/domain/valueObject'

export class ScoreBonusVO extends ValueObject {
  readonly value: number
  constructor(value: number) {
    super()
    if (value < -50 || value > 50) {
      throw new Error('ScoreBonus must be between -50 and 50')
    }
    this.value = value
  }

  static create(value: number): ScoreBonusVO {
    return new ScoreBonusVO(value)
  }

  static none(): ScoreBonusVO {
    return new ScoreBonusVO(0)
  }
}
