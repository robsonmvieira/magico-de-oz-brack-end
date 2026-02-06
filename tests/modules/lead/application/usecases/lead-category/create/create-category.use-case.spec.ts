import { Test, TestingModule } from '@nestjs/testing'
import { CreateCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/create/create-category.use-case'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { CreateCategoryInput } from '@modules/lead/application/use-cases/lead-category/create/dtos'

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase
  let repository: jest.Mocked<ILeadCategoryRepository>

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ILeadCategoryRepository> = {
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      findByKeywordMatch: jest.fn(),
      findActive: jest.fn(),
      findBySlug: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      upsert: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  describe('execute', () => {
    const validInput: CreateCategoryInput = {
      name: 'Marketing Digital',
      description: 'Leads de marketing digital',
      priority: 2,
      scoreBonus: 15,
      keywords: ['marketing', 'digital'],
      color: 'blue'
    }

    it('should create a category successfully with all fields', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const result = await useCase.execute(validInput)

      expect(repository.existsByName).toHaveBeenCalledWith('Marketing Digital')
      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.name).toBe('Marketing Digital')
      expect(result.data.slug).toBe('marketing-digital')
      expect(result.data.description).toBe('Leads de marketing digital')
      expect(result.data.priority).toBe(2)
      expect(result.data.scoreBonus).toBe(15)
      expect(result.data.keywords).toEqual(['marketing', 'digital'])
      expect(result.data.color).toBe('blue')
    })

    it('should create a category with only required fields', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const input: CreateCategoryInput = {
        name: 'Vendas'
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)
      expect(result.data.name).toBe('Vendas')
      expect(result.data.slug).toBe('vendas')
      expect(result.data.priority).toBe(3) // default
      expect(result.data.scoreBonus).toBe(0) // default
      expect(result.data.color).toBe('gray') // default
    })

    it('should return error when category name already exists', async () => {
      repository.existsByName.mockResolvedValue(true)

      const result = await useCase.execute(validInput)

      expect(repository.existsByName).toHaveBeenCalledWith('Marketing Digital')
      expect(repository.save).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.error.name).toContain(
        'Category with this name already exists'
      )
      expect(result.data).toBeNull()
    })

    describe('validation errors', () => {
      it('should return error when name is empty', async () => {
        const input: CreateCategoryInput = {
          name: ''
        }

        const result = await useCase.execute(input)

        expect(repository.existsByName).not.toHaveBeenCalled()
        expect(repository.save).not.toHaveBeenCalled()
        expect(result.hasError).toBe(true)
        expect(result.ok).toBe(false)
        expect(result.error.name).toBeDefined()
        expect(result.data).toBeNull()
      })

      it('should return error when name is too short', async () => {
        const input: CreateCategoryInput = {
          name: 'A'
        }

        const result = await useCase.execute(input)

        expect(result.hasError).toBe(true)
        expect(result.error.name).toBeDefined()
      })

      it('should return error when name is too long', async () => {
        const input: CreateCategoryInput = {
          name: 'A'.repeat(101)
        }

        const result = await useCase.execute(input)

        expect(result.hasError).toBe(true)
        expect(result.error.name).toBeDefined()
      })

      it('should return error when priority is out of range', async () => {
        const input: CreateCategoryInput = {
          name: 'Valid Name',
          priority: 10
        }

        const result = await useCase.execute(input)

        expect(result.hasError).toBe(true)
        expect(result.error.priority).toBeDefined()
      })

      it('should return error when scoreBonus is out of range', async () => {
        const input: CreateCategoryInput = {
          name: 'Valid Name',
          scoreBonus: 100
        }

        const result = await useCase.execute(input)

        expect(result.hasError).toBe(true)
        expect(result.error.scoreBonus).toBeDefined()
      })

      it('should return error when color is invalid', async () => {
        const input = {
          name: 'Valid Name',
          color: 'invalid-color'
        } as unknown as CreateCategoryInput

        const result = await useCase.execute(input)

        expect(result.hasError).toBe(true)
        expect(result.error.color).toBeDefined()
      })
    })

    it('should generate slug from name', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const input: CreateCategoryInput = {
        name: 'Marketing Digital Premium'
      }

      const result = await useCase.execute(input)

      expect(result.data.slug).toBe('marketing-digital-premium')
    })

    it('should generate unique id for category', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const result = await useCase.execute(validInput)

      expect(result.data.id).toBeDefined()
      expect(result.data.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should call save with correct model data', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      await useCase.execute(validInput)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Marketing Digital',
          slug: 'marketing-digital',
          description: 'Leads de marketing digital',
          priority: 2,
          score_bonus: 15,
          keywords: 'marketing,digital',
          color: 'blue'
        })
      )
    })

    it('should include createdAt timestamp in response', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const result = await useCase.execute(validInput)

      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should handle empty keywords array', async () => {
      repository.existsByName.mockResolvedValue(false)
      repository.save.mockResolvedValue()

      const input: CreateCategoryInput = {
        name: 'Test Category',
        keywords: []
      }

      const result = await useCase.execute(input)

      expect(result.hasError).toBe(false)
      expect(result.data.keywords).toEqual([])
    })
  })
})
