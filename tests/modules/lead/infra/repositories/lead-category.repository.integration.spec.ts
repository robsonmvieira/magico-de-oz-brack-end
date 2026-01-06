import { Test, TestingModule } from '@nestjs/testing'
import { LeadCategoryRepository } from '@modules/lead/infra/repositories/lead-category.repository'
import { DatabaseModule, DRIZZLE, DrizzleDB } from '@modules/database'
import { EnvModule } from '@modules/env'
import { NewLeadCategoryModel } from '@modules/lead/domain/models/lead-category.model'
import { randomUUID } from 'node:crypto'

describe('LeadCategoryRepository (Integration)', () => {
  let repository: LeadCategoryRepository
  let module: TestingModule

  const makeCategory = (
    overrides: Partial<NewLeadCategoryModel> = {}
  ): NewLeadCategoryModel => ({
    id: randomUUID(),
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    description: 'A test category',
    priority: 1,
    score_bonus: 10,
    keywords: 'test,category,keywords',
    color: '#FF0000',
    ...overrides
  })

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [LeadCategoryRepository]
    }).compile()

    repository = module.get<LeadCategoryRepository>(LeadCategoryRepository)
  })

  afterAll(async () => {
    await module.close()
  })

  describe('save', () => {
    it('should save a new category to the database', async () => {
      const category = makeCategory()

      await repository.save(category)

      const found = await repository.findById(category.id!)
      expect(found).not.toBeNull()
      expect(found?.name).toBe(category.name)
      expect(found?.slug).toBe(category.slug)
    })
  })

  describe('update', () => {
    it('should update an existing category', async () => {
      const category = makeCategory()
      await repository.save(category)

      const newName = `Updated Name ${Date.now()}`
      await repository.update(category.id!, { name: newName })

      const updated = await repository.findById(category.id!)
      expect(updated?.name).toBe(newName)
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
      const found = await repository.findById(randomUUID())

      expect(found).toBeNull()
    })
  })

  describe('findByKeywordMatch', () => {
    it('should find categories matching keywords (case insensitive)', async () => {
      const uniqueKeyword = `unique-keyword-${Date.now()}`
      const category = makeCategory({
        keywords: `${uniqueKeyword},other,keywords`
      })
      await repository.save(category)

      const found = await repository.findByKeywordMatch(uniqueKeyword)

      expect(found.length).toBeGreaterThanOrEqual(1)
      expect(found.some(c => c.id === category.id)).toBe(true)
    })
  })

  describe('findActive', () => {
    it('should return only active categories', async () => {
      const category = makeCategory()
      await repository.save(category)

      const active = await repository.findActive()

      expect(active.some(c => c.id === category.id)).toBe(true)
    })
  })

  describe('findBySlug', () => {
    it('should find a category by slug', async () => {
      const uniqueSlug = `unique-slug-${Date.now()}`
      const category = makeCategory({ slug: uniqueSlug })
      await repository.save(category)

      const found = await repository.findBySlug(uniqueSlug)

      expect(found).not.toBeNull()
      expect(found?.slug).toBe(uniqueSlug)
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
      const exists = await repository.exists(randomUUID())

      expect(exists).toBe(false)
    })
  })

  describe('existsByName', () => {
    it('should return true for existing name', async () => {
      const uniqueName = `Unique Name ${Date.now()}`
      await repository.save(makeCategory({ name: uniqueName }))

      const exists = await repository.existsByName(uniqueName)

      expect(exists).toBe(true)
    })

    it('should return false for non-existing name', async () => {
      const exists = await repository.existsByName(
        'Non Existing Name ' + Date.now()
      )

      expect(exists).toBe(false)
    })
  })
})
