import { Test, TestingModule } from '@nestjs/testing'
import { GetCategoryByIdUseCase } from '@modules/lead/application/use-cases/lead-category/get-by-id/get-category-by-id.use-case'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('GetCategoryByIdUseCase', () => {
  let useCase: GetCategoryByIdUseCase
  let repository: jest.Mocked<ILeadCategoryRepository>

  const validUUID = randomUUID()

  const mockCategory = {
    id: validUUID,
    name: 'Marketing Digital',
    slug: 'marketing-digital',
    description: 'Leads de marketing digital',
    priority: 2,
    score_bonus: 15,
    keywords: 'marketing,digital',
    color: 'blue',
    isActive: true,
    isDeleted: false,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: null
  }

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
        GetCategoryByIdUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get<GetCategoryByIdUseCase>(GetCategoryByIdUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  describe('execute', () => {
    it('should return category when found', async () => {
      repository.findById.mockResolvedValue(mockCategory)

      const result = await useCase.execute(validUUID)

      expect(repository.findById).toHaveBeenCalledWith(validUUID)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe(validUUID)
      expect(result.data.name).toBe('Marketing Digital')
      expect(result.data.slug).toBe('marketing-digital')
      expect(result.data.description).toBe('Leads de marketing digital')
      expect(result.data.priority).toBe(2)
      expect(result.data.scoreBonus).toBe(15)
      expect(result.data.keywords).toEqual(['marketing', 'digital'])
      expect(result.data.color).toBe('blue')
    })

    it('should return error when category not found', async () => {
      repository.findById.mockResolvedValue(null)

      const result = await useCase.execute(validUUID)

      expect(repository.findById).toHaveBeenCalledWith(validUUID)
      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(result.error.id).toContain('Category not found')
      expect(result.data).toBeNull()
    })

    it('should return error when id is empty', async () => {
      const result = await useCase.execute('')

      expect(repository.findById).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toBeDefined()
    })

    it('should return error when id is whitespace only', async () => {
      const result = await useCase.execute('   ')

      expect(repository.findById).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should return error when id is invalid UUID', async () => {
      const result = await useCase.execute('invalid-uuid')

      expect(repository.findById).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toContain('Invalid UUID format')
    })

    it('should handle repository errors gracefully', async () => {
      repository.findById.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(validUUID)

      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message).toContain('Database error')
    })

    it('should return empty keywords array when category has no keywords', async () => {
      const categoryWithoutKeywords = {
        ...mockCategory,
        keywords: ''
      }
      repository.findById.mockResolvedValue(categoryWithoutKeywords)

      const result = await useCase.execute(validUUID)

      expect(result.hasError).toBe(false)
      expect(result.data.keywords).toEqual([])
    })

    it('should return empty description when category has null description', async () => {
      const categoryWithoutDescription = {
        ...mockCategory,
        description: null
      }
      repository.findById.mockResolvedValue(categoryWithoutDescription)

      const result = await useCase.execute(validUUID)

      expect(result.hasError).toBe(false)
      expect(result.data.description).toBe('')
    })
  })
})
