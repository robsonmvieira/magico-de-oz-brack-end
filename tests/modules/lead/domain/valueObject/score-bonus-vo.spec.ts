import { ScoreBonusVO } from '@modules/lead/domain/valueObject'

describe('ScoreBonusVO', () => {
  describe('create', () => {
    it('should create score bonus with valid positive value', () => {
      const scoreBonus = ScoreBonusVO.create(25)

      expect(scoreBonus.value).toBe(25)
    })

    it('should create score bonus with valid negative value', () => {
      const scoreBonus = ScoreBonusVO.create(-25)

      expect(scoreBonus.value).toBe(-25)
    })

    it('should create score bonus with zero', () => {
      const scoreBonus = ScoreBonusVO.create(0)

      expect(scoreBonus.value).toBe(0)
    })

    it('should accept minimum value (-50)', () => {
      const scoreBonus = ScoreBonusVO.create(-50)

      expect(scoreBonus.value).toBe(-50)
    })

    it('should accept maximum value (50)', () => {
      const scoreBonus = ScoreBonusVO.create(50)

      expect(scoreBonus.value).toBe(50)
    })

    it('should throw error for value below minimum', () => {
      expect(() => ScoreBonusVO.create(-51)).toThrow(
        'ScoreBonus must be between -50 and 50'
      )
    })

    it('should throw error for value above maximum', () => {
      expect(() => ScoreBonusVO.create(51)).toThrow(
        'ScoreBonus must be between -50 and 50'
      )
    })
  })

  describe('factory methods', () => {
    it('should create none (0) score bonus', () => {
      const scoreBonus = ScoreBonusVO.none()

      expect(scoreBonus.value).toBe(0)
    })
  })
})
