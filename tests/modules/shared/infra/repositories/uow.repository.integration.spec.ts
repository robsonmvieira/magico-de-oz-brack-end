import { Test, TestingModule } from '@nestjs/testing'
import { UnitOfWorkDrizzleRepository } from '@modules/shared/infra/repositories'
import { DatabaseModule, DRIZZLE, DrizzleDB } from '@modules/database'
import { EnvModule } from '@modules/env'
import { LeadCategoryRepository } from '@modules/lead/infra/repositories/lead-category.repository'
import { NewLeadCategoryModel } from '@modules/lead/domain/models/lead-category.model'
import { randomUUID } from 'node:crypto'

describe('UnitOfWorkDrizzleRepository (Integration)', () => {
  let uow: UnitOfWorkDrizzleRepository
  let categoryRepository: LeadCategoryRepository
  let db: DrizzleDB
  let module: TestingModule

  const makeCategory = (
    overrides: Partial<NewLeadCategoryModel> = {}
  ): NewLeadCategoryModel => ({
    id: randomUUID(),
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'A test category for UoW',
    priority: 1,
    score_bonus: 10,
    keywords: 'test,uow,keywords',
    color: '#00FF00',
    ...overrides
  })

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [UnitOfWorkDrizzleRepository, LeadCategoryRepository]
    }).compile()

    uow = module.get<UnitOfWorkDrizzleRepository>(UnitOfWorkDrizzleRepository)
    categoryRepository = module.get<LeadCategoryRepository>(
      LeadCategoryRepository
    )
    db = module.get<DrizzleDB>(DRIZZLE)
  })

  afterAll(async () => {
    await module.close()
  })

  describe('do - successful transactions', () => {
    it('should commit transaction when callback succeeds', async () => {
      const category = makeCategory()

      await uow.do(async tx => {
        await categoryRepository.save(category, tx)
      })

      const found = await categoryRepository.findById(category.id!)
      expect(found).not.toBeNull()
      expect(found?.name).toBe(category.name)
    })

    it('should execute multiple operations in same transaction', async () => {
      const category1 = makeCategory()
      const category2 = makeCategory()

      await uow.do(async tx => {
        await categoryRepository.save(category1, tx)
        await categoryRepository.save(category2, tx)
      })

      const found1 = await categoryRepository.findById(category1.id!)
      const found2 = await categoryRepository.findById(category2.id!)

      expect(found1).not.toBeNull()
      expect(found2).not.toBeNull()
    })

    it('should return value from callback', async () => {
      const category = makeCategory()

      const result = await uow.do(async tx => {
        await categoryRepository.save(category, tx)
        return { savedId: category.id }
      })

      expect(result.savedId).toBe(category.id)
    })
  })

  describe('do - rollback on error', () => {
    it('should rollback all operations when an error occurs', async () => {
      const category = makeCategory()
      const categoryId = category.id!

      await expect(
        uow.do(async tx => {
          await categoryRepository.save(category, tx)
          throw new Error('Simulated error')
        })
      ).rejects.toThrow('Simulated error')

      const found = await categoryRepository.findById(categoryId)
      expect(found).toBeNull()
    })

    it('should rollback all operations even after multiple inserts', async () => {
      const category1 = makeCategory()
      const category2 = makeCategory()

      await expect(
        uow.do(async tx => {
          await categoryRepository.save(category1, tx)
          await categoryRepository.save(category2, tx)
          throw new Error('Rollback all')
        })
      ).rejects.toThrow('Rollback all')

      const found1 = await categoryRepository.findById(category1.id!)
      const found2 = await categoryRepository.findById(category2.id!)

      expect(found1).toBeNull()
      expect(found2).toBeNull()
    })
  })

  describe('do - with update operations', () => {
    it('should commit update within transaction', async () => {
      const category = makeCategory()
      await categoryRepository.save(category)

      const newName = `Updated ${Date.now()}`

      await uow.do(async tx => {
        await categoryRepository.update(category.id!, { name: newName }, tx)
      })

      const found = await categoryRepository.findById(category.id!)
      expect(found?.name).toBe(newName)
    })

    it('should rollback update when error occurs', async () => {
      const category = makeCategory()
      const originalName = category.name
      await categoryRepository.save(category)

      await expect(
        uow.do(async tx => {
          await categoryRepository.update(
            category.id!,
            { name: 'Should not persist' },
            tx
          )
          throw new Error('Rollback update')
        })
      ).rejects.toThrow('Rollback update')

      const found = await categoryRepository.findById(category.id!)
      expect(found?.name).toBe(originalName)
    })
  })

  describe('do - with delete operations', () => {
    it('should commit soft delete within transaction', async () => {
      const category = makeCategory()
      await categoryRepository.save(category)
      const saved = await categoryRepository.findById(category.id!)

      await uow.do(async tx => {
        await categoryRepository.delete(saved!, tx)
      })

      const found = await categoryRepository.findById(category.id!)
      expect(found?.isDeleted).toBe(true)
    })

    it('should rollback soft delete when error occurs', async () => {
      const category = makeCategory()
      await categoryRepository.save(category)
      const saved = await categoryRepository.findById(category.id!)

      await expect(
        uow.do(async tx => {
          await categoryRepository.delete(saved!, tx)
          throw new Error('Rollback delete')
        })
      ).rejects.toThrow('Rollback delete')

      const found = await categoryRepository.findById(category.id!)
      expect(found?.isDeleted).toBe(false)
    })
  })

  describe('do - complex scenarios', () => {
    it('should handle insert, update and read in same transaction', async () => {
      const category = makeCategory()

      const result = await uow.do(async tx => {
        await categoryRepository.save(category, tx)

        await categoryRepository.update(
          category.id!,
          { description: 'Updated in tx' },
          tx
        )

        const found = await categoryRepository.findById(category.id!, tx)
        return found
      })

      expect(result?.description).toBe('Updated in tx')
    })
  })
})
