import { CreateLeadUseCase } from '@modules/lead/application/use-cases/lead/create'
import { LeadInMemoryRepository } from 'tests/modules/lead/infra/repositories/lead-in-memory.repository'
import { LeadCategoryInMemoryRepository } from 'tests/modules/lead/infra/repositories/lead-category-in-memory.repository'
import { LeadSource } from '@modules/lead/domain/enums'
import { HttpStatus } from '@nestjs/common'
import { randomUUID } from 'crypto'

describe('CreateLeadUseCase', () => {
  let useCase: CreateLeadUseCase
  let leadRepository: LeadInMemoryRepository
  let categoryRepository: LeadCategoryInMemoryRepository

  const validCategoryId = randomUUID()

  const createValidInput = (overrides = {}) => ({
    leadCategoryId: validCategoryId,
    companyName: 'Empresa ABC LTDA',
    source: LeadSource.MANUAL,
    ...overrides
  })

  beforeEach(async () => {
    leadRepository = new LeadInMemoryRepository()
    categoryRepository = new LeadCategoryInMemoryRepository()

    // Create a valid category
    await categoryRepository.save({
      id: validCategoryId,
      name: 'Test Category',
      slug: 'test-category',
      priority: 1,
      score_bonus: 10,
      keywords: 'test',
      color: 'blue'
    })

    useCase = new CreateLeadUseCase()
    ;(useCase as any).repo = leadRepository
    ;(useCase as any).categoryRepo = categoryRepository
  })

  describe('execute', () => {
    it('should create a lead with valid input', async () => {
      const input = createValidInput()

      const result = await useCase.execute(input)

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.CREATED)
      expect(result.data).not.toBeNull()
      expect(result.data?.companyName).toBe(input.companyName)
      expect(result.data?.source).toBe(input.source)
    })

    it('should create a lead with all optional fields', async () => {
      const input = createValidInput({
        tradeName: 'ABC Tech',
        phone: '11987654321',
        email: 'contato@empresa.com',
        website: 'https://www.empresa.com',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP'
        }
      })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(true)
      expect(result.data?.tradeName).toBe('ABC Tech')
      expect(result.data?.phone).toBe('11987654321')
      expect(result.data?.email).toBe('contato@empresa.com')
      expect(result.data?.website).toBe('https://www.empresa.com')
    })

    it('should initialize enrichmentStatus with all sources as not enriched', async () => {
      const input = createValidInput()

      const result = await useCase.execute(input)

      expect(result.ok).toBe(true)
      expect(result.data?.enrichmentStatus.googleMaps.enriched).toBe(false)
      expect(result.data?.enrichmentStatus.cnpjWs.enriched).toBe(false)
      expect(result.data?.enrichmentStatus.apollo.enriched).toBe(false)
      expect(result.data?.enrichmentStatus.hunter.enriched).toBe(false)
      expect(result.data?.enrichmentStatus.linkedin.enriched).toBe(false)
    })

    it('should initialize score with default values', async () => {
      const input = createValidInput()

      const result = await useCase.execute(input)

      expect(result.ok).toBe(true)
      expect(result.data?.score.completeness).toBe(0)
      expect(result.data?.score.icpFit).toBe(0)
      expect(result.data?.score.engagement).toBe(0)
    })

    it('should return error when leadCategoryId is invalid UUID', async () => {
      const input = createValidInput({ leadCategoryId: 'invalid-uuid' })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.leadCategoryId).toBeDefined()
    })

    it('should return error when category does not exist', async () => {
      const input = createValidInput({ leadCategoryId: randomUUID() })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(result.error.leadCategoryId).toContain('Lead category not found')
    })

    it('should return error when companyName is empty', async () => {
      const input = createValidInput({ companyName: '' })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.companyName).toBeDefined()
    })

    it('should return error when companyName already exists', async () => {
      const input = createValidInput({ companyName: 'Empresa Existente' })

      await useCase.execute(input)
      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.CONFLICT)
      expect(result.error.companyName).toContain(
        'Lead with this company name already exists'
      )
    })

    it('should return error when email already exists', async () => {
      await useCase.execute(
        createValidInput({
          companyName: 'Empresa 1',
          email: 'duplicado@email.com'
        })
      )

      const result = await useCase.execute(
        createValidInput({
          companyName: 'Empresa 2',
          email: 'duplicado@email.com'
        })
      )

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.CONFLICT)
      expect(result.error.email).toContain(
        'Lead with this email already exists'
      )
    })

    it('should return error when source is invalid', async () => {
      const input = createValidInput({ source: 'invalid_source' })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.source).toBeDefined()
    })

    it('should return error when phone format is invalid', async () => {
      const input = createValidInput({ phone: '123' })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.phone).toBeDefined()
    })

    it('should return error when email format is invalid', async () => {
      const input = createValidInput({ email: 'invalid-email' })

      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(result.error.email).toBeDefined()
    })

    it('should handle repository errors gracefully', async () => {
      const errorRepo = {
        existsByCompanyName: jest.fn().mockResolvedValue(false),
        existsByEmail: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }
      ;(useCase as any).repo = errorRepo

      const input = createValidInput()
      const result = await useCase.execute(input)

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message).toContain('Database error')
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })
})
