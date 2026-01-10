import { Test, TestingModule } from '@nestjs/testing'
import { UpdateCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/update/update-category.use-case'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { UpdateCategoryInput } from '@modules/lead/application/use-cases/lead-category/update/dtos'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase
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
      existsByName: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  describe('execute', () => {
    it('should update category name successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.existsByName.mockResolvedValue(false)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        name: 'Marketing Premium'
      }

      const result = await useCase.execute(validUUID, input)

      expect(repository.findById).toHaveBeenCalledWith(validUUID)
      expect(repository.existsByName).toHaveBeenCalledWith('Marketing Premium')
      expect(repository.update).toHaveBeenCalledTimes(1)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data.name).toBe('Marketing Premium')
      expect(result.data.slug).toBe('marketing-premium')
    })

    it('should update category description successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        description: 'Nova descrição'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.description).toBe('Nova descrição')
    })

    it('should update category priority successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        priority: 1
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.priority).toBe(1)
    })

    it('should update category scoreBonus successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        scoreBonus: 25
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.scoreBonus).toBe(25)
    })

    it('should update category color successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        color: 'red'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.color).toBe('red')
    })

    it('should update category keywords successfully', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        keywords: 'seo,sem,ads'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.keywords).toEqual(['seo', 'sem', 'ads'])
    })

    it('should update multiple fields at once', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.existsByName.mockResolvedValue(false)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        name: 'Novo Nome',
        description: 'Nova descrição',
        priority: 1,
        color: 'green'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.name).toBe('Novo Nome')
      expect(result.data.description).toBe('Nova descrição')
      expect(result.data.priority).toBe(1)
      expect(result.data.color).toBe('green')
    })

    it('should return error when category not found', async () => {
      repository.findById.mockResolvedValue(null)

      const input: UpdateCategoryInput = {
        name: 'Novo Nome'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(result.error.id).toContain('Category not found')
    })

    it('should return error when new name already exists', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.existsByName.mockResolvedValue(true)

      const input: UpdateCategoryInput = {
        name: 'Existing Category'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(true)
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.CONFLICT)
      expect(result.error.name).toContain(
        'Category with this name already exists'
      )
    })

    it('should not check name uniqueness if name is not changed', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        name: 'Marketing Digital' // Same name
      }

      const result = await useCase.execute(validUUID, input)

      expect(repository.existsByName).not.toHaveBeenCalled()
      expect(result.hasError).toBe(false)
    })

    it('should return error when id is empty', async () => {
      const input: UpdateCategoryInput = {
        name: 'Novo Nome'
      }

      const result = await useCase.execute('', input)

      expect(repository.findById).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toBeDefined()
    })

    it('should return error when id is invalid UUID', async () => {
      const input: UpdateCategoryInput = {
        name: 'Novo Nome'
      }

      const result = await useCase.execute('invalid-uuid', input)

      expect(repository.findById).not.toHaveBeenCalled()
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toContain('Invalid UUID format')
    })

    it('should handle repository errors gracefully', async () => {
      repository.findById.mockRejectedValue(new Error('Database error'))

      const input: UpdateCategoryInput = {
        name: 'Novo Nome'
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message).toContain('Database error')
    })

    it('should allow updating to empty description', async () => {
      repository.findById.mockResolvedValue(mockCategory)
      repository.update.mockResolvedValue()

      const input: UpdateCategoryInput = {
        description: ''
      }

      const result = await useCase.execute(validUUID, input)

      expect(result.hasError).toBe(false)
      expect(result.data.description).toBe('')
    })
  })
})
