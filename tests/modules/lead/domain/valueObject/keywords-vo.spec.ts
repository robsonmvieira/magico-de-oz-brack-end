import { KeywordsVO, KeywordVO } from '@modules/lead/domain/valueObject'

describe('KeywordsVO', () => {
  describe('create', () => {
    it('should create keywords from string array', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital', 'ads'])

      expect(keywords.count).toBe(3)
      expect(keywords.toArray()).toEqual(['marketing', 'digital', 'ads'])
    })

    it('should remove duplicates', () => {
      const keywords = KeywordsVO.create([
        'marketing',
        'digital',
        'marketing'
      ])

      expect(keywords.count).toBe(2)
    })

    it('should create empty keywords', () => {
      const keywords = KeywordsVO.create([])

      expect(keywords.count).toBe(0)
    })
  })

  describe('empty', () => {
    it('should create empty keywords collection', () => {
      const keywords = KeywordsVO.empty()

      expect(keywords.count).toBe(0)
      expect(keywords.toArray()).toEqual([])
    })
  })

  describe('add', () => {
    it('should add new keyword', () => {
      const keywords = KeywordsVO.create(['marketing'])
      const newKeyword = KeywordVO.create('digital')

      const updated = keywords.add(newKeyword)

      expect(updated.count).toBe(2)
      expect(updated.toArray()).toContain('digital')
    })

    it('should not add duplicate keyword', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])
      const duplicateKeyword = KeywordVO.create('marketing')

      const updated = keywords.add(duplicateKeyword)

      expect(updated.count).toBe(2)
    })

    it('should return same instance when adding duplicate', () => {
      const keywords = KeywordsVO.create(['marketing'])
      const duplicateKeyword = KeywordVO.create('marketing')

      const updated = keywords.add(duplicateKeyword)

      expect(updated).toBe(keywords)
    })

    it('should be immutable', () => {
      const original = KeywordsVO.create(['marketing'])
      const newKeyword = KeywordVO.create('digital')

      original.add(newKeyword)

      expect(original.count).toBe(1)
    })
  })

  describe('remove', () => {
    it('should remove existing keyword', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])
      const toRemove = KeywordVO.create('marketing')

      const updated = keywords.remove(toRemove)

      expect(updated.count).toBe(1)
      expect(updated.toArray()).not.toContain('marketing')
    })

    it('should not change when removing non-existing keyword', () => {
      const keywords = KeywordsVO.create(['marketing'])
      const toRemove = KeywordVO.create('digital')

      const updated = keywords.remove(toRemove)

      expect(updated.count).toBe(1)
    })

    it('should be immutable', () => {
      const original = KeywordsVO.create(['marketing', 'digital'])
      const toRemove = KeywordVO.create('marketing')

      original.remove(toRemove)

      expect(original.count).toBe(2)
    })
  })

  describe('contains', () => {
    it('should return true when keyword exists', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])
      const keyword = KeywordVO.create('marketing')

      expect(keywords.contains(keyword)).toBe(true)
    })

    it('should return false when keyword does not exist', () => {
      const keywords = KeywordsVO.create(['marketing'])
      const keyword = KeywordVO.create('digital')

      expect(keywords.contains(keyword)).toBe(false)
    })
  })

  describe('matchesAny', () => {
    it('should return true when any keyword matches text', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])

      expect(keywords.matchesAny('Digital Marketing Agency')).toBe(true)
    })

    it('should return false when no keyword matches text', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])

      expect(keywords.matchesAny('Finance Company')).toBe(false)
    })

    it('should return false for empty keywords', () => {
      const keywords = KeywordsVO.empty()

      expect(keywords.matchesAny('Marketing Digital')).toBe(false)
    })
  })

  describe('countMatches', () => {
    it('should count matching keywords', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital', 'agency'])

      expect(keywords.countMatches('Digital Marketing')).toBe(2)
    })

    it('should return zero when no matches', () => {
      const keywords = KeywordsVO.create(['finance', 'banking'])

      expect(keywords.countMatches('Marketing Digital')).toBe(0)
    })

    it('should return zero for empty keywords', () => {
      const keywords = KeywordsVO.empty()

      expect(keywords.countMatches('Marketing')).toBe(0)
    })
  })

  describe('toArray', () => {
    it('should return array of keyword values', () => {
      const keywords = KeywordsVO.create(['marketing', 'digital'])

      expect(keywords.toArray()).toEqual(['marketing', 'digital'])
    })
  })

  describe('count', () => {
    it('should return the number of keywords', () => {
      const keywords = KeywordsVO.create(['one', 'two', 'three'])

      expect(keywords.count).toBe(3)
    })
  })
})
