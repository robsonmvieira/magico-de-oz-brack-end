import { LeadCategoryEntity } from '@modules/lead/domain/entities/lead-category.entity'
import { LeadCategoryId } from '@modules/lead/domain/valueObject'

describe('LeadCategoryEntity', () => {
  describe('create', () => {
    it('should create a category with required fields', () => {
      const category = LeadCategoryEntity.create({
        name: 'Marketing Digital'
      })

      expect(category).toBeInstanceOf(LeadCategoryEntity)
      expect(category._name.value).toBe('Marketing Digital')
      expect(category._slug.value).toBe('marketing-digital')
      expect(category.is_active).toBe(true)
      expect(category.is_deleted).toBe(false)
      expect(category.is_blocked).toBe(false)
    })

    it('should create a category with all fields', () => {
      const category = LeadCategoryEntity.create({
        name: 'Tecnologia da Informação',
        description: 'Categoria para leads de TI',
        priority: 5,
        scoreBonus: 25,
        keywords: ['ti', 'software', 'tecnologia'],
        color: 'blue'
      })

      expect(category._name.value).toBe('Tecnologia da Informação')
      expect(category._slug.value).toBe('tecnologia-da-informacao')
      expect(category._description).toBe('Categoria para leads de TI')
      expect(category._priority.value).toBe(5)
      expect(category._scoreBonus.value).toBe(25)
      expect(category._keywords.items.map(k => k.value)).toEqual([
        'ti',
        'software',
        'tecnologia'
      ])
      expect(category._color.value).toBe('blue')
    })

    it('should generate slug from name with special characters', () => {
      const category = LeadCategoryEntity.create({
        name: 'Educação & Treinamento'
      })

      expect(category._slug.value).toBe('educacao-treinamento')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute a category from props', () => {
      const id = LeadCategoryId.create()
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-01-02')

      const category = LeadCategoryEntity.reconstitute({
        id,
        name: 'Saúde',
        slug: 'saude',
        description: 'Categoria de saúde',
        priority: 5,
        scoreBonus: 10,
        keywords: ['saude', 'medico'],
        color: 'green',
        is_active: true,
        is_deleted: false,
        is_blocked: false,
        created_at: createdAt,
        updated_at: updatedAt
      })

      expect(category.id).toBe(id)
      expect(category._name.value).toBe('Saúde')
      expect(category._slug.value).toBe('saude')
      expect(category.created_at).toBe(createdAt)
      expect(category.updated_at).toBe(updatedAt)
    })
  })

  describe('fake', () => {
    it('should return LeadCategoryFakeBuilder class', () => {
      expect(LeadCategoryEntity.fake().aCategory).toBeDefined()
      expect(LeadCategoryEntity.fake().theCategories).toBeDefined()
    })

    it('should build a valid category using fake builder', () => {
      const category = LeadCategoryEntity.fake().aCategory().build()

      expect(category).toBeInstanceOf(LeadCategoryEntity)
      expect(category._name.value).toBeDefined()
      expect(category._slug.value).toBeDefined()
      expect(category._priority.value).toBeGreaterThanOrEqual(1)
      expect(category._priority.value).toBeLessThanOrEqual(5)
    })

    it('should build multiple categories using fake builder', () => {
      const categories = LeadCategoryEntity.fake().theCategories(5).build()

      expect(categories).toHaveLength(5)
      categories.forEach(category => {
        expect(category).toBeInstanceOf(LeadCategoryEntity)
      })
    })
  })

  describe('rename', () => {
    it('should rename category and update slug', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withName('Nome Antigo')
        .build()

      const originalUpdatedAt = category.updated_at

      category.rename('Nome Novo')

      expect(category._name.value).toBe('Nome Novo')
      expect(category._slug.value).toBe('nome-novo')
      expect(category.updated_at).not.toBe(originalUpdatedAt)
    })

    it('should handle special characters when renaming', () => {
      const category = LeadCategoryEntity.fake().aCategory().build()

      category.rename('Alimentação & Bebidas')

      expect(category._name.value).toBe('Alimentação & Bebidas')
      expect(category._slug.value).toBe('alimentacao-bebidas')
    })
  })

  describe('updateDescription', () => {
    it('should update description', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withDescription('Descrição antiga')
        .build()

      category.updateDescription('Nova descrição')

      expect(category._description).toBe('Nova descrição')
    })

    it('should trim description whitespace', () => {
      const category = LeadCategoryEntity.fake().aCategory().build()

      category.updateDescription('  Descrição com espaços  ')

      expect(category._description).toBe('Descrição com espaços')
    })

    it('should allow undefined description', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withDescription('Descrição')
        .build()

      category.updateDescription(undefined)

      expect(category._description).toBeUndefined()
    })
  })

  describe('changePriority', () => {
    it('should change priority', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withPriority(3)
        .build()

      category.changePriority(5)

      expect(category._priority.value).toBe(5)
    })

    it('should update updated_at when changing priority', () => {
      const category = LeadCategoryEntity.fake().aCategory().build()
      const originalUpdatedAt = category.updated_at

      category.changePriority(4)

      expect(category.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('changeScoreBonus', () => {
    it('should change score bonus', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withScoreBonus(10)
        .build()

      category.changeScoreBonus(25)

      expect(category._scoreBonus.value).toBe(25)
    })
  })

  describe('changeColor', () => {
    it('should change color', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withColor('red')
        .build()

      category.changeColor('green')

      expect(category._color.value).toBe('green')
    })
  })

  describe('keywords management', () => {
    it('should add keyword', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withKeywords(['existing'])
        .build()

      category.addKeyword('new-keyword')

      const keywords = category._keywords.items.map(k => k.value)
      expect(keywords).toContain('existing')
      expect(keywords).toContain('new-keyword')
    })

    it('should remove keyword', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withKeywords(['keep', 'remove'])
        .build()

      category.removeKeyword('remove')

      const keywords = category._keywords.items.map(k => k.value)
      expect(keywords).toContain('keep')
      expect(keywords).not.toContain('remove')
    })

    it('should update updated_at when managing keywords', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withKeywords(['test'])
        .build()
      const originalUpdatedAt = category.updated_at

      category.addKeyword('new')

      expect(category.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('activate/deactivate', () => {
    it('should activate an inactive category', () => {
      const category = LeadCategoryEntity.fake().aCategory().inactive().build()

      expect(category.is_active).toBe(false)

      category.activate()

      expect(category.is_active).toBe(true)
    })

    it('should not change updated_at if already active', () => {
      const category = LeadCategoryEntity.fake().aCategory().active().build()
      const originalUpdatedAt = category.updated_at

      category.activate()

      expect(category.updated_at).toBe(originalUpdatedAt)
    })

    it('should deactivate an active category', () => {
      const category = LeadCategoryEntity.fake().aCategory().active().build()

      expect(category.is_active).toBe(true)

      category.deactivate()

      expect(category.is_active).toBe(false)
    })

    it('should not change updated_at if already inactive', () => {
      const category = LeadCategoryEntity.fake().aCategory().inactive().build()
      const originalUpdatedAt = category.updated_at

      category.deactivate()

      expect(category.updated_at).toBe(originalUpdatedAt)
    })
  })

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withName('Test Category')
        .withDescription('Test description')
        .withPriority(5)
        .withScoreBonus(15)
        .withKeywords(['test', 'category'])
        .withColor('purple')
        .build()

      const json = category.toJSON()

      expect(json).toEqual({
        id: category.id.id,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        priority: 5,
        scoreBonus: 15,
        keywords: ['test', 'category'],
        color: 'purple'
      })
    })

    it('should handle undefined description in JSON', () => {
      const category = LeadCategoryEntity.fake()
        .aCategory()
        .withDescription(undefined)
        .build()

      const json = category.toJSON()

      expect(json.description).toBeUndefined()
    })
  })

  describe('entity_id', () => {
    it('should return the entity id', () => {
      const id = LeadCategoryId.create()
      const category = LeadCategoryEntity.fake().aCategory().withId(id).build()

      expect(category.entity_id).toBe(id)
    })
  })
})
