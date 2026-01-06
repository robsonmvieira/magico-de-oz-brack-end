import { LeadCategoryInMemoryRepository } from './lead-category-in-memory.repository'
import { NewLeadCategoryModel } from '@modules/lead/domain/models/lead-category.model'
import { randomUUID } from 'node:crypto'

describe('LeadCategoryInMemoryRepository', () => {
  let repository: LeadCategoryInMemoryRepository

  const makeCategory = (
    overrides: Partial<NewLeadCategoryModel> = {}
  ): NewLeadCategoryModel => ({
    id: randomUUID(),
    name: 'Test Category',
    slug: 'test-category',
    description: 'A test category',
    priority: 1,
    score_bonus: 10,
    keywords: 'test,category,keywords',
    color: '#FF0000',
    ...overrides
  })

  beforeEach(() => {
    repository = new LeadCategoryInMemoryRepository()
  })

  describe('save', () => {
    it('should save a new category', async () => {
      const category = makeCategory()

      await repository.save(category)

      const items = repository.getItems()
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe(category.name)
      expect(items[0].slug).toBe(category.slug)
    })

    it('should generate id if not provided', async () => {
      const category = makeCategory({ id: undefined })

      await repository.save(category)

      const items = repository.getItems()
      expect(items[0].id).toBeDefined()
      expect(typeof items[0].id).toBe('string')
    })

    it('should set default values for timestamps and flags', async () => {
      const category = makeCategory()

      await repository.save(category)

      const items = repository.getItems()
      expect(items[0].createdAt).toBeInstanceOf(Date)
      expect(items[0].updatedAt).toBeInstanceOf(Date)
      expect(items[0].isDeleted).toBe(false)
      expect(items[0].isActive).toBe(true)
      expect(items[0].isBlocked).toBe(false)
    })
  })

  describe('update', () => {
    it('should update an existing category', async () => {
      const category = makeCategory()
      await repository.save(category)

      await repository.update(category.id!, { name: 'Updated Name' })

      const updated = await repository.findById(category.id!)
      expect(updated?.name).toBe('Updated Name')
    })

    it('should update the updatedAt timestamp', async () => {
      const category = makeCategory()
      await repository.save(category)
      const originalUpdatedAt = (await repository.findById(category.id!))
        ?.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))
      await repository.update(category.id!, { name: 'Updated Name' })

      const updated = await repository.findById(category.id!)
      expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
        originalUpdatedAt?.getTime() ?? 0
      )
    })

    it('should not update non-existing category', async () => {
      await repository.update('non-existing-id', { name: 'Updated Name' })

      const items = repository.getItems()
      expect(items).toHaveLength(0)
    })
  })

  describe('delete', () => {
    it('should soft delete a category', async () => {
      const category = makeCategory()
      await repository.save(category)
      const saved = await repository.findById(category.id!)

      await repository.delete(saved!)

      const deleted = await repository.findById(category.id!)
      expect(deleted?.isDeleted).toBe(true)
    })

    it('should not return deleted categories in findAll', async () => {
      const category = makeCategory()
      await repository.save(category)
      const saved = await repository.findById(category.id!)

      await repository.delete(saved!)

      const all = await repository.findAll()
      expect(all).toHaveLength(0)
    })
  })

  describe('findById', () => {
    it('should find a category by id', async () => {
      const category = makeCategory()
      await repository.save(category)

      const found = await repository.findById(category.id!)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(category.id)
    })

    it('should return null for non-existing id', async () => {
      const found = await repository.findById('non-existing-id')

      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all non-deleted categories', async () => {
      await repository.save(makeCategory({ name: 'Category 1' }))
      await repository.save(makeCategory({ name: 'Category 2' }))
      await repository.save(makeCategory({ name: 'Category 3' }))

      const all = await repository.findAll()

      expect(all).toHaveLength(3)
    })

    it('should not return deleted categories', async () => {
      const category = makeCategory()
      await repository.save(category)
      const saved = await repository.findById(category.id!)
      await repository.delete(saved!)

      const all = await repository.findAll()

      expect(all).toHaveLength(0)
    })
  })

  describe('findByKeywordMatch', () => {
    it('should find categories matching keywords', async () => {
      await repository.save(
        makeCategory({ name: 'Sales', keywords: 'vendas,comercial,negocio' })
      )
      await repository.save(
        makeCategory({ name: 'Support', keywords: 'suporte,ajuda,ticket' })
      )

      const found = await repository.findByKeywordMatch('vendas')

      expect(found).toHaveLength(1)
      expect(found[0].name).toBe('Sales')
    })

    it('should be case insensitive', async () => {
      await repository.save(
        makeCategory({ name: 'Sales', keywords: 'VENDAS,COMERCIAL' })
      )

      const found = await repository.findByKeywordMatch('vendas')

      expect(found).toHaveLength(1)
    })

    it('should return empty array when no match', async () => {
      await repository.save(
        makeCategory({ keywords: 'vendas,comercial,negocio' })
      )

      const found = await repository.findByKeywordMatch('suporte')

      expect(found).toHaveLength(0)
    })
  })

  describe('findActive', () => {
    it('should return only active categories', async () => {
      await repository.save(makeCategory({ name: 'Active 1' }))
      await repository.save(makeCategory({ name: 'Active 2' }))
      const category = makeCategory({ name: 'To Deactivate' })
      await repository.save(category)
      await repository.update(category.id!, { isActive: false } as any)

      const active = await repository.findActive()

      expect(active).toHaveLength(2)
    })
  })

  describe('findBySlug', () => {
    it('should find a category by slug', async () => {
      await repository.save(makeCategory({ slug: 'my-unique-slug' }))

      const found = await repository.findBySlug('my-unique-slug')

      expect(found).not.toBeNull()
      expect(found?.slug).toBe('my-unique-slug')
    })

    it('should return null for non-existing slug', async () => {
      const found = await repository.findBySlug('non-existing-slug')

      expect(found).toBeNull()
    })
  })

  describe('exists', () => {
    it('should return true for existing category', async () => {
      const category = makeCategory()
      await repository.save(category)

      const exists = await repository.exists(category.id!)

      expect(exists).toBe(true)
    })

    it('should return false for non-existing category', async () => {
      const exists = await repository.exists('non-existing-id')

      expect(exists).toBe(false)
    })
  })

  describe('existsByName', () => {
    it('should return true for existing name', async () => {
      await repository.save(makeCategory({ name: 'Unique Name' }))

      const exists = await repository.existsByName('Unique Name')

      expect(exists).toBe(true)
    })

    it('should return false for non-existing name', async () => {
      const exists = await repository.existsByName('Non Existing Name')

      expect(exists).toBe(false)
    })
  })

  describe('clear', () => {
    it('should remove all items', async () => {
      await repository.save(makeCategory())
      await repository.save(makeCategory())

      repository.clear()

      const items = repository.getItems()
      expect(items).toHaveLength(0)
    })
  })
})
