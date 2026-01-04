import { SlugVO } from '@modules/lead/domain/valueObject'

describe('SlugVO', () => {
  describe('create', () => {
    it('should create a slug with the given value', () => {
      const slug = SlugVO.create('my-slug')

      expect(slug.value).toBe('my-slug')
    })
  })

  describe('fromName', () => {
    it('should convert name to lowercase slug', () => {
      const slug = SlugVO.fromName('Marketing Digital')

      expect(slug.value).toBe('marketing-digital')
    })

    it('should remove accents', () => {
      const slug = SlugVO.fromName('Educação')

      expect(slug.value).toBe('educacao')
    })

    it('should replace special characters with hyphens', () => {
      const slug = SlugVO.fromName('Alimentação & Bebidas')

      expect(slug.value).toBe('alimentacao-bebidas')
    })

    it('should remove leading hyphens', () => {
      const slug = SlugVO.fromName('---Leading Hyphens')

      expect(slug.value).toBe('leading-hyphens')
    })

    it('should remove trailing hyphens', () => {
      const slug = SlugVO.fromName('Trailing Hyphens---')

      expect(slug.value).toBe('trailing-hyphens')
    })

    it('should handle multiple spaces', () => {
      const slug = SlugVO.fromName('Multiple   Spaces')

      expect(slug.value).toBe('multiple-spaces')
    })

    it('should handle complex names', () => {
      const slug = SlugVO.fromName('São Paulo - Capital (Brasil)')

      expect(slug.value).toBe('sao-paulo-capital-brasil')
    })

    it('should handle numbers', () => {
      const slug = SlugVO.fromName('Web 3.0 Tecnologia')

      expect(slug.value).toBe('web-3-0-tecnologia')
    })
  })
})
