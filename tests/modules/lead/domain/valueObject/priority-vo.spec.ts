import { PriorityVO } from '@modules/lead/domain/valueObject'

describe('PriorityVO', () => {
  describe('create', () => {
    it('should create priority with valid value', () => {
      const priority = PriorityVO.create(3)

      expect(priority.value).toBe(3)
    })

    it('should accept minimum value (1)', () => {
      const priority = PriorityVO.create(1)

      expect(priority.value).toBe(1)
    })

    it('should accept maximum value (5)', () => {
      const priority = PriorityVO.create(5)

      expect(priority.value).toBe(5)
    })

    it('should throw error for value below minimum', () => {
      expect(() => PriorityVO.create(0)).toThrow(
        'Priority must be between 1 and 5'
      )
    })

    it('should throw error for value above maximum', () => {
      expect(() => PriorityVO.create(6)).toThrow(
        'Priority must be between 1 and 5'
      )
    })

    it('should throw error for negative value', () => {
      expect(() => PriorityVO.create(-1)).toThrow(
        'Priority must be between 1 and 5'
      )
    })
  })

  describe('factory methods', () => {
    it('should create low priority (1)', () => {
      const priority = PriorityVO.low()

      expect(priority.value).toBe(1)
    })

    it('should create medium priority (3)', () => {
      const priority = PriorityVO.medium()

      expect(priority.value).toBe(3)
    })

    it('should create high priority (5)', () => {
      const priority = PriorityVO.high()

      expect(priority.value).toBe(5)
    })
  })

  describe('isHigherThan', () => {
    it('should return true when priority is higher', () => {
      const high = PriorityVO.high()
      const low = PriorityVO.low()

      expect(high.isHigherThan(low)).toBe(true)
    })

    it('should return false when priority is lower', () => {
      const low = PriorityVO.low()
      const high = PriorityVO.high()

      expect(low.isHigherThan(high)).toBe(false)
    })

    it('should return false when priorities are equal', () => {
      const priority1 = PriorityVO.medium()
      const priority2 = PriorityVO.medium()

      expect(priority1.isHigherThan(priority2)).toBe(false)
    })
  })
})
