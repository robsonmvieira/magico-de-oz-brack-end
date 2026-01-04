import { KeywordVO } from '@modules/lead/domain/valueObject'

describe('KeywordVO', () => {
  describe('create', () => {
    it('should create keyword with valid value', () => {
      const keyword = KeywordVO.create('marketing')

      expect(keyword.value).toBe('marketing')
    })

    it('should convert to lowercase', () => {
      const keyword = KeywordVO.create('MARKETING')

      expect(keyword.value).toBe('marketing')
    })

    it('should trim whitespace', () => {
      const keyword = KeywordVO.create('  marketing  ')

      expect(keyword.value).toBe('marketing')
    })

    it('should accept minimum length (2 characters)', () => {
      const keyword = KeywordVO.create('ti')

      expect(keyword.value).toBe('ti')
    })

    it('should accept maximum length (50 characters)', () => {
      const longKeyword = 'a'.repeat(50)
      const keyword = KeywordVO.create(longKeyword)

      expect(keyword.value).toBe(longKeyword)
    })

    it('should throw error for keyword too short', () => {
      expect(() => KeywordVO.create('a')).toThrow(
        'Keyword must be between 2 and 50 characters'
      )
    })

    it('should throw error for keyword too long', () => {
      const tooLong = 'a'.repeat(51)
      expect(() => KeywordVO.create(tooLong)).toThrow(
        'Keyword must be between 2 and 50 characters'
      )
    })

    it('should throw error for empty string', () => {
      expect(() => KeywordVO.create('')).toThrow(
        'Keyword must be between 2 and 50 characters'
      )
    })

    it('should throw error for whitespace only', () => {
      expect(() => KeywordVO.create('   ')).toThrow(
        'Keyword must be between 2 and 50 characters'
      )
    })
  })

  describe('matches', () => {
    it('should match when text contains keyword', () => {
      const keyword = KeywordVO.create('marketing')

      expect(keyword.matches('Marketing Digital')).toBe(true)
    })

    it('should match case insensitively', () => {
      const keyword = KeywordVO.create('tech')

      expect(keyword.matches('TECH COMPANY')).toBe(true)
    })

    it('should return false when text does not contain keyword', () => {
      const keyword = KeywordVO.create('finance')

      expect(keyword.matches('Marketing Digital')).toBe(false)
    })

    it('should match partial words', () => {
      const keyword = KeywordVO.create('market')

      expect(keyword.matches('Supermarket')).toBe(true)
    })
  })
})
