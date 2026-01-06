import { Test, TestingModule } from '@nestjs/testing'
import { CreateCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/create/create-category.use-case'
import { LeadCategoryRepository } from '@modules/lead/infra/repositories/lead-category.repository'
import { DatabaseModule } from '@modules/database'
import { EnvModule } from '@modules/env'
import { CreateCategoryInput } from '@modules/lead/application/use-cases/lead-category/create/dtos'

describe('CreateCategoryUseCase (Integration)', () => {
  let useCase: CreateCategoryUseCase
  let repository: LeadCategoryRepository
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [
        CreateCategoryUseCase,
        LeadCategoryRepository,
        {
          provide: 'ILeadCategoryRepository',
          useClass: LeadCategoryRepository
        }
      ]
    }).compile()

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase)
    repository = module.get<LeadCategoryRepository>(LeadCategoryRepository)
  })

  afterAll(async () => {
    await module.close()
  })

  describe('execute', () => {
    it('should create a category and persist to database', async () => {
      const input: CreateCategoryInput = {
        name: `Integration Test Category ${Date.now()}`,
        description: 'Created via integration test',
        priority: 2,
        scoreBonus: 10,
        keywords: ['integration', 'test'],
        color: 'blue'
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBeDefined()

      // Verify persisted in database
      const found = await repository.findById(result.data.id)
      expect(found).not.toBeNull()
      expect(found?.name).toBe(input.name)
      expect(found?.slug).toContain('integration-test-category')
      expect(found?.description).toBe(input.description)
      expect(found?.priority).toBe(input.priority)
      expect(found?.score_bonus).toBe(input.scoreBonus)
      expect(found?.color).toBe(input.color)
    })

    it('should fail when creating category with duplicate name', async () => {
      const uniqueName = `Duplicate Test ${Date.now()}`
      const input: CreateCategoryInput = {
        name: uniqueName
      }

      // First creation should succeed
      const firstResult = await useCase.execute(input)
      expect(firstResult.hasError).toBe(false)

      // Second creation with same name should fail
      const secondResult = await useCase.execute(input)
      expect(secondResult.hasError).toBe(true)
      expect(secondResult.error.name).toContain(
        'Category with this name already exists'
      )
    })

    it('should create category with default values', async () => {
      const input: CreateCategoryInput = {
        name: `Default Values Test ${Date.now()}`
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)
      expect(result.data.priority).toBe(3)
      expect(result.data.scoreBonus).toBe(0)
      expect(result.data.color).toBe('gray')
      expect(result.data.keywords).toEqual([])
    })

    it('should validate input before saving', async () => {
      const input: CreateCategoryInput = {
        name: 'A', // too short
        priority: 10 // out of range
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(true)
      expect(result.error.name).toBeDefined()
      expect(result.error.priority).toBeDefined()
    })

    it('should generate correct slug from name', async () => {
      const input: CreateCategoryInput = {
        name: `Slug Generation Test ${Date.now()}`
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)
      expect(result.data.slug).toMatch(/^slug-generation-test-\d+$/)
    })

    it('should convert keywords array to comma-separated string in database', async () => {
      const input: CreateCategoryInput = {
        name: `Keywords Test ${Date.now()}`,
        keywords: ['keyword1', 'keyword2', 'keyword3']
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)

      const found = await repository.findById(result.data.id)
      expect(found?.keywords).toBe('keyword1,keyword2,keyword3')
    })
  })
})
