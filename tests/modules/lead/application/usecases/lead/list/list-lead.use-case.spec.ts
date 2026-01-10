import { ListLeadUseCase } from '@modules/lead/application/use-cases/lead/list'
import { LeadInMemoryRepository } from 'tests/modules/lead/infra/repositories/lead-in-memory.repository'
import { LeadSource } from '@modules/lead/domain/enums'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('ListLeadUseCase', () => {
  let useCase: ListLeadUseCase
  let repository: LeadInMemoryRepository

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
    useCase = new ListLeadUseCase()
    ;(useCase as any).repo = repository
  })

  describe('execute', () => {
    it('should return empty list when no leads exist', async () => {
      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.data).toHaveLength(0)
      expect(result.totalItems).toBe(0)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should return list of leads', async () => {
      await repository.save(createValidLead({ companyName: 'Empresa 1' }))
      await repository.save(createValidLead({ companyName: 'Empresa 2' }))
      await repository.save(createValidLead({ companyName: 'Empresa 3' }))

      const result = await useCase.execute()

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.data).toHaveLength(3)
      expect(result.totalItems).toBe(3)
      expect(result.statusCode).toBe(HttpStatus.OK)
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
        findAll: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      ;(useCase as any).repo = errorRepo

      const result = await useCase.execute()

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message).toContain('Database error')
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })
})
