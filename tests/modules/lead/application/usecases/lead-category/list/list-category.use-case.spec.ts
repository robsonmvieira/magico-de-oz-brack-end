import { Test, TestingModule } from '@nestjs/testing'
import { ListCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/list/list-category.use-case'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryModel } from '@modules/lead/domain/models/lead-category.model'

describe('ListCategoryUseCase', () => {
  let useCase: ListCategoryUseCase
  let repository: jest.Mocked<ILeadCategoryRepository>

  const makeCategory = (
    overrides: Partial<LeadCategoryModel> = {}
  ): LeadCategoryModel => ({
    id: 'category-id-1',
    name: 'Marketing Digital',
    slug: 'marketing-digital',
    description: 'Leads de marketing digital',
    priority: 1,
    score_bonus: 10,
    keywords: 'marketing,digital,ads',
    color: '#FF0000',
    isActive: true,
    isDeleted: false,
    isBlocked: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  })

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
        ListCategoryUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get<ListCategoryUseCase>(ListCategoryUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  describe('execute', () => {
    it('should return empty list when no categories exist', async () => {
      repository.findAll.mockResolvedValue([])

      const result = await useCase.execute()

      expect(repository.findAll).toHaveBeenCalledTimes(1)
      expect(result.data).toEqual([])
      expect(result.totalItems).toBe(0)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return list of categories when categories exist', async () => {
      const categories = [
        makeCategory({ id: 'cat-1', name: 'Marketing' }),
        makeCategory({ id: 'cat-2', name: 'Vendas' }),
        makeCategory({ id: 'cat-3', name: 'Suporte' })
      ]
      repository.findAll.mockResolvedValue(categories)

      const result = await useCase.execute()

      expect(repository.findAll).toHaveBeenCalledTimes(1)
      expect(result.data).toHaveLength(3)
      expect(result.totalItems).toBe(3)
      expect(result.hasError).toBe(false)
      expect(result.ok).toBe(true)
    })

    it('should map category model to output format', async () => {
      const category = makeCategory({
        id: 'cat-1',
        name: 'Marketing Digital',
        slug: 'marketing-digital',
        description: 'Leads de marketing',
        priority: 2,
        score_bonus: 15,
        keywords: 'marketing,digital',
        color: '#00FF00'
      })
      repository.findAll.mockResolvedValue([category])

      const result = await useCase.execute()

      expect(result.data[0]).toMatchObject({
        id: 'cat-1',
        name: 'Marketing Digital',
        slug: 'marketing-digital',
        description: 'Leads de marketing',
        priority: 2,
        scoreBonus: 15,
        keywords: ['marketing', 'digital'],
        color: '#00FF00'
      })
    })

    it('should return single category when only one exists', async () => {
      const category = makeCategory()
      repository.findAll.mockResolvedValue([category])

      const result = await useCase.execute()

      expect(result.data).toHaveLength(1)
      expect(result.totalItems).toBe(1)
    })

    it('should include createdAt timestamp in response', async () => {
      repository.findAll.mockResolvedValue([])

      const result = await useCase.execute()

      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should handle large number of categories', async () => {
      const categories = Array.from({ length: 100 }, (_, i) =>
        makeCategory({ id: `cat-${i}`, name: `Category ${i}` })
      )
      repository.findAll.mockResolvedValue(categories)

      const result = await useCase.execute()

      expect(result.data).toHaveLength(100)
      expect(result.totalItems).toBe(100)
    })
  })
})
