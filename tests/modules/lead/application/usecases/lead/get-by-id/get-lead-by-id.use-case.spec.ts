import { GetLeadByIdUseCase } from '@modules/lead/application/use-cases/lead/get-by-id'
import { LeadInMemoryRepository } from 'tests/modules/lead/infra/repositories/lead-in-memory.repository'
import { LeadSource } from '@modules/lead/domain/enums'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('GetLeadByIdUseCase', () => {
  let useCase: GetLeadByIdUseCase
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
    useCase = new GetLeadByIdUseCase()
    ;(useCase as any).repo = repository
  })

  describe('execute', () => {
    it('should return lead when found', async () => {
      const leadId = randomUUID()
      const categoryId = randomUUID()
      await repository.save(
        createValidLead({
          id: leadId,
          leadCategoryId: categoryId,
          companyName: 'Empresa XYZ',
          tradeName: 'XYZ Tech',
          email: 'contato@xyz.com'
        })
      )

      const result = await useCase.execute(leadId)

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data).not.toBeNull()
      expect(result.data?.id).toBe(leadId)
      expect(result.data?.companyName).toBe('Empresa XYZ')
      expect(result.data?.tradeName).toBe('XYZ Tech')
      expect(result.data?.email).toBe('contato@xyz.com')
    })

    it('should return complete lead data', async () => {
      const leadId = randomUUID()
      await repository.save(
        createValidLead({
          id: leadId,
          companyName: 'Empresa Completa',
          tradeName: 'Trade Name',
          phone: '11987654321',
          email: 'email@test.com',
          website: 'https://www.test.com',
          address: {
            street: 'Rua Test',
            city: 'São Paulo',
            state: 'SP'
          },
          googleMapsData: {
            placeId: 'place123',
            category: 'restaurant',
            rating: 4.5,
            reviewsCount: 100
          }
        })
      )

      const result = await useCase.execute(leadId)

      expect(result.ok).toBe(true)
      expect(result.data?.phone).toBe('11987654321')
      expect(result.data?.website).toBe('https://www.test.com')
      expect(result.data?.address).toEqual({
        street: 'Rua Test',
        city: 'São Paulo',
        state: 'SP'
      })
      expect(result.data?.googleMapsData?.placeId).toBe('place123')
      expect(result.data?.enrichmentStatus).toBeDefined()
      expect(result.data?.score).toBeDefined()
    })

    it('should return error when lead not found', async () => {
      const nonExistentId = randomUUID()

      const result = await useCase.execute(nonExistentId)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(result.error.id).toContain('Lead not found')
    })

    it('should return error when id is invalid UUID', async () => {
      const result = await useCase.execute('invalid-uuid')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.id).toContain('Invalid UUID format')
    })

    it('should return error when id is empty', async () => {
      const result = await useCase.execute('')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should handle repository errors gracefully', async () => {
      const errorRepo = {
        findById: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      ;(useCase as any).repo = errorRepo

      const result = await useCase.execute(randomUUID())

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message).toContain('Database error')
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })
})
