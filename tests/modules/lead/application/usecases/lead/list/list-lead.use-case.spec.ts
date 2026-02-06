import { ListLeadUseCase } from '@modules/lead/application/use-cases/lead/list'
import { LeadInMemoryRepository } from 'tests/modules/lead/infra/repositories/lead-in-memory.repository'
import { LeadSource } from '@modules/lead/domain/enums'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { ICacheRepository } from '@modules/core/domain/repositories'

const createMockCacheRepository = (): jest.Mocked<ICacheRepository> => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined)
})

describe('ListLeadUseCase', () => {
  let useCase: ListLeadUseCase
  let repository: LeadInMemoryRepository
  let cacheRepository: jest.Mocked<ICacheRepository>

  const createValidLead = (overrides = {}) => ({
    id: randomUUID(),
    leadCategoryId: randomUUID(),
    companyName: 'Empresa ABC LTDA',
    source: LeadSource.MANUAL,
    enrichmentStatus: {
      googleMaps: { enriched: false },
      cnpjWs: { enriched: false },
      apollo: { enriched: false },
      hunter: { enriched: false },
      linkedin: { enriched: false }
    },
    score: {
      completeness: 0,
      icpFit: 50,
      engagement: 0
    },
    decisionMakers: [],
    ...overrides
  })

  beforeEach(() => {
    repository = new LeadInMemoryRepository()
    cacheRepository = createMockCacheRepository()
    useCase = new ListLeadUseCase()
    ;(useCase as any).repo = repository
    ;(useCase as any).cacheRepo = cacheRepository
  })

  describe('execute', () => {
    it('should return empty list when no leads exist', async () => {
      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.data).toHaveLength(0)
      expect(result.totalItems).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should return paginated list of leads', async () => {
      await repository.save(createValidLead({ companyName: 'Empresa 1' }))
      await repository.save(createValidLead({ companyName: 'Empresa 2' }))
      await repository.save(createValidLead({ companyName: 'Empresa 3' }))

      const result = await useCase.execute({ page: 1, limit: 10 })

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.data).toHaveLength(3)
      expect(result.totalItems).toBe(3)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should paginate correctly with limit', async () => {
      for (let i = 1; i <= 15; i++) {
        await repository.save(createValidLead({ companyName: `Empresa ${i}` }))
      }

      const page1 = await useCase.execute({ page: 1, limit: 5 })
      expect(page1.data).toHaveLength(5)
      expect(page1.totalItems).toBe(15)
      expect(page1.totalPages).toBe(3)
      expect(page1.hasNextPage).toBe(true)
      expect(page1.hasPreviousPage).toBe(false)

      const page2 = await useCase.execute({ page: 2, limit: 5 })
      expect(page2.data).toHaveLength(5)
      expect(page2.hasNextPage).toBe(true)
      expect(page2.hasPreviousPage).toBe(true)

      const page3 = await useCase.execute({ page: 3, limit: 5 })
      expect(page3.data).toHaveLength(5)
      expect(page3.hasNextPage).toBe(false)
      expect(page3.hasPreviousPage).toBe(true)
    })

    it('should not return deleted leads', async () => {
      const lead = createValidLead({ companyName: 'Empresa Deletada' })
      await repository.save(lead)
      const savedLead = await repository.findById(lead.id)
      await repository.delete(savedLead!)

      await repository.save(createValidLead({ companyName: 'Empresa Ativa' }))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].companyName).toBe('Empresa Ativa')
    })

    it('should return leads with correct output format', async () => {
      const categoryId = randomUUID()
      await repository.save(
        createValidLead({
          leadCategoryId: categoryId,
          companyName: 'Empresa XYZ',
          tradeName: 'XYZ Tech',
          email: 'contato@xyz.com',
          phone: '11987654321'
        })
      )

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.data).toHaveLength(1)

      const lead = result.data[0]
      expect(lead.leadCategoryId).toBe(categoryId)
      expect(lead.companyName).toBe('Empresa XYZ')
      expect(lead.tradeName).toBe('XYZ Tech')
      expect(lead.email).toBe('contato@xyz.com')
      expect(lead.phone).toBe('11987654321')
      expect(lead.enrichmentStatus).toBeDefined()
      expect(lead.score).toBeDefined()
    })

    it('should handle repository errors gracefully', async () => {
      const errorRepo = {
        findAllPaginated: jest
          .fn()
          .mockRejectedValue(new Error('Database error'))
      }
      ;(useCase as any).repo = errorRepo
      ;(useCase as any).cacheRepo = cacheRepository

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message).toContain('Database error')
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should return cached data when available', async () => {
      const cachedData = {
        data: [{ id: randomUUID(), companyName: 'Cached Company' }],
        totalItems: 1,
        page: 1,
        limit: 10
      }
      cacheRepository.get.mockResolvedValue(JSON.stringify(cachedData))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.data).toEqual(cachedData.data)
      expect(result.totalItems).toBe(1)
    })

    it('should cache data after fetching from repository', async () => {
      await repository.save(createValidLead({ companyName: 'Empresa 1' }))

      await useCase.execute()

      expect(cacheRepository.set).toHaveBeenCalledWith(
        expect.stringContaining('leads:'),
        expect.any(String),
        30
      )
    })

    it('should filter by search term', async () => {
      await repository.save(createValidLead({ companyName: 'Restaurante ABC' }))
      await repository.save(createValidLead({ companyName: 'Padaria XYZ' }))
      await repository.save(createValidLead({ companyName: 'Restaurante DEF' }))

      const result = await useCase.execute({ search: 'Restaurante' })

      expect(result.ok).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(
        result.data.every(l => l.companyName.includes('Restaurante'))
      ).toBe(true)
    })
  })

  describe('executeAll', () => {
    it('should return all leads without pagination', async () => {
      await repository.save(createValidLead({ companyName: 'Empresa 1' }))
      await repository.save(createValidLead({ companyName: 'Empresa 2' }))
      await repository.save(createValidLead({ companyName: 'Empresa 3' }))

      const result = await useCase.executeAll()

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.data).toHaveLength(3)
      expect(result.totalItems).toBe(3)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })
  })
})
