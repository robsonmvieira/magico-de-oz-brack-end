import { Test, TestingModule } from '@nestjs/testing'
import { DeleteCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/delete/delete-category.use-case'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase
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
      findByKeywordMatch: jest.fn(),
      findActive: jest.fn(),
      findBySlug: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      upsert: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  describe('execute', () => {
    it('should delete category successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.delete.mockResolvedValue()

      const result = await useCase.execute(validUUID)

      expect(repository.findById).toHaveBeenCalledWith(validUUID)
      expect(repository.delete).toHaveBeenCalledWith(mockCategory)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data).toEqual({
        id: validUUID,
        deleted: true
      })
    })

    it('should return error when category not found', async () => {
      repository.findById.mockResolvedValue(null)

      const result = await useCase.execute(validUUID)

      expect(repository.findById).toHaveBeenCalledWith(validUUID)
      expect(repository.delete).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(result.error.id).toContain('Category not found')
      expect(result.data).toBeNull()
    })

    it('should return error when id is empty', async () => {
      const result = await useCase.execute('')

      expect(repository.findById).not.toHaveBeenCalled()
      expect(repository.delete).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
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
      expect(repository.delete).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toContain('Invalid UUID format')
    })

    it('should handle repository findById errors gracefully', async () => {
      repository.findById.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(validUUID)

      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message).toContain('Database error')
    })

    it('should handle repository delete errors gracefully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.delete.mockRejectedValue(new Error('Delete failed'))

      const result = await useCase.execute(validUUID)

      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message).toContain('Delete failed')
    })

    it('should call delete with correct category', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.delete.mockResolvedValue()

      await useCase.execute(validUUID)

      expect(repository.delete).toHaveBeenCalledWith(mockCategory)
    })
  })
})
