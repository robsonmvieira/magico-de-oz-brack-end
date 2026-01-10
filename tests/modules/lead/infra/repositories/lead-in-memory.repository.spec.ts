import { LeadInMemoryRepository } from './lead-in-memory.repository'
import { NewLeadModel } from '@modules/lead/domain/models'
import {
  LeadStage,
  LeadTemperature,
  LeadSource
} from '@modules/lead/domain/enums'
import { randomUUID } from 'crypto'

describe('LeadInMemoryRepository', () => {
  let repository: LeadInMemoryRepository

  const createValidLead = (
    overrides: Partial<NewLeadModel> = {}
  ): NewLeadModel => ({
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
  })

  describe('save', () => {
    it('should save a lead', async () => {
      const lead = createValidLead()

      await repository.save(lead)

      const items = repository.getItems()
      expect(items).toHaveLength(1)
      expect(items[0].companyName).toBe(lead.companyName)
    })

    it('should generate id if not provided', async () => {
      const lead = createValidLead({ id: undefined })

      await repository.save(lead)

      const items = repository.getItems()
      expect(items[0].id).toBeDefined()
    })

    it('should set default values', async () => {
      const lead = createValidLead()

      await repository.save(lead)

      const items = repository.getItems()
      expect(items[0].isDeleted).toBe(false)
      expect(items[0].isActive).toBe(true)
      expect(items[0].isBlocked).toBe(false)
      expect(items[0].createdAt).toBeInstanceOf(Date)
      expect(items[0].updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('update', () => {
    it('should update a lead', async () => {
      const lead = createValidLead()
      await repository.save(lead)

      await repository.update(lead.id!, { companyName: 'Empresa XYZ LTDA' })

      const updated = await repository.findById(lead.id!)
      expect(updated?.companyName).toBe('Empresa XYZ LTDA')
    })

    it('should update updatedAt timestamp', async () => {
      const lead = createValidLead()
      await repository.save(lead)
      const originalUpdatedAt = (await repository.findById(lead.id!))?.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))
      await repository.update(lead.id!, { tradeName: 'ABC Tech' })

      const updated = await repository.findById(lead.id!)
      expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
        originalUpdatedAt?.getTime() ?? 0
      )
    })
  })

  describe('delete', () => {
    it('should soft delete a lead', async () => {
      const lead = createValidLead()
      await repository.save(lead)
      const savedLead = await repository.findById(lead.id!)

      await repository.delete(savedLead!)

      const deleted = await repository.findById(lead.id!)
      expect(deleted?.isDeleted).toBe(true)
    })

    it('should not return deleted leads in findAll', async () => {
      const lead = createValidLead()
      await repository.save(lead)
      const savedLead = await repository.findById(lead.id!)

      await repository.delete(savedLead!)

      const all = await repository.findAll()
      expect(all).toHaveLength(0)
    })
  })

  describe('findById', () => {
    it('should find a lead by id', async () => {
      const lead = createValidLead()
      await repository.save(lead)

      const found = await repository.findById(lead.id!)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(lead.id)
    })

    it('should return null if not found', async () => {
      const found = await repository.findById(randomUUID())

      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all non-deleted leads', async () => {
      await repository.save(createValidLead())
      await repository.save(createValidLead({ companyName: 'Empresa 2' }))

      const all = await repository.findAll()

      expect(all).toHaveLength(2)
    })

    it('should not return deleted leads', async () => {
      const lead = createValidLead()
      await repository.save(lead)
      const savedLead = await repository.findById(lead.id!)
      await repository.delete(savedLead!)

      const all = await repository.findAll()

      expect(all).toHaveLength(0)
    })
  })

  describe('findByCompanyName', () => {
    it('should find a lead by company name', async () => {
      const lead = createValidLead({ companyName: 'Empresa Única LTDA' })
      await repository.save(lead)

      const found = await repository.findByCompanyName('Empresa Única LTDA')

      expect(found).not.toBeNull()
      expect(found?.companyName).toBe('Empresa Única LTDA')
    })

    it('should return null if not found', async () => {
      const found = await repository.findByCompanyName('Não Existe')

      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find a lead by email', async () => {
      const lead = createValidLead({ email: 'contato@empresa.com.br' })
      await repository.save(lead)

      const found = await repository.findByEmail('contato@empresa.com.br')

      expect(found).not.toBeNull()
      expect(found?.email).toBe('contato@empresa.com.br')
    })

    it('should return null if not found', async () => {
      const found = await repository.findByEmail('naoexiste@email.com')

      expect(found).toBeNull()
    })
  })

  describe('findByPhone', () => {
    it('should find a lead by phone', async () => {
      const lead = createValidLead({ phone: '11987654321' })
      await repository.save(lead)

      const found = await repository.findByPhone('11987654321')

      expect(found).not.toBeNull()
      expect(found?.phone).toBe('11987654321')
    })

    it('should return null if not found', async () => {
      const found = await repository.findByPhone('00000000000')

      expect(found).toBeNull()
    })
  })

  describe('findByCategoryId', () => {
    it('should find leads by category id', async () => {
      const categoryId = randomUUID()
      await repository.save(createValidLead({ leadCategoryId: categoryId }))
      await repository.save(createValidLead({ leadCategoryId: categoryId }))
      await repository.save(createValidLead({ leadCategoryId: randomUUID() }))

      const found = await repository.findByCategoryId(categoryId)

      expect(found).toHaveLength(2)
    })

    it('should return empty array if none found', async () => {
      const found = await repository.findByCategoryId(randomUUID())

      expect(found).toHaveLength(0)
    })
  })

  describe('findByStage', () => {
    it('should find leads by stage', async () => {
      await repository.save(createValidLead({ stage: LeadStage.NEW }))
      await repository.save(createValidLead({ stage: LeadStage.NEW }))
      await repository.save(createValidLead({ stage: LeadStage.CONTACTED }))

      const found = await repository.findByStage(LeadStage.NEW)

      expect(found).toHaveLength(2)
    })
  })

  describe('findByTemperature', () => {
    it('should find leads by temperature', async () => {
      await repository.save(
        createValidLead({ temperature: LeadTemperature.HOT })
      )
      await repository.save(
        createValidLead({ temperature: LeadTemperature.HOT })
      )
      await repository.save(
        createValidLead({ temperature: LeadTemperature.COLD })
      )

      const found = await repository.findByTemperature(LeadTemperature.HOT)

      expect(found).toHaveLength(2)
    })
  })

  describe('findActive', () => {
    it('should return only active leads', async () => {
      const lead1 = createValidLead()
      const lead2 = createValidLead()
      await repository.save(lead1)
      await repository.save(lead2)

      const savedLead = await repository.findById(lead1.id!)
      await repository.delete(savedLead!)

      const active = await repository.findActive()

      expect(active).toHaveLength(1)
    })
  })

  describe('findByGooglePlaceId', () => {
    it('should find a lead by Google Place ID', async () => {
      const lead = createValidLead({
        googleMapsData: {
          placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
          category: 'restaurant'
        }
      })
      await repository.save(lead)

      const found = await repository.findByGooglePlaceId(
        'ChIJrTLr-GyuEmsRBfy61i59si0'
      )

      expect(found).not.toBeNull()
      expect(found?.googleMapsData?.placeId).toBe('ChIJrTLr-GyuEmsRBfy61i59si0')
    })

    it('should return null if not found', async () => {
      const found = await repository.findByGooglePlaceId('nonexistent')

      expect(found).toBeNull()
    })
  })

  describe('findByCnpj', () => {
    it('should find a lead by CNPJ', async () => {
      const lead = createValidLead({
        cnpjWsData: {
          cnpj: '12345678000190',
          businessName: 'Empresa ABC LTDA'
        }
      })
      await repository.save(lead)

      const found = await repository.findByCnpj('12345678000190')

      expect(found).not.toBeNull()
      expect(found?.cnpjWsData?.cnpj).toBe('12345678000190')
    })

    it('should find CNPJ with different formatting', async () => {
      const lead = createValidLead({
        cnpjWsData: {
          cnpj: '12.345.678/0001-90',
          businessName: 'Empresa ABC LTDA'
        }
      })
      await repository.save(lead)

      const found = await repository.findByCnpj('12345678000190')

      expect(found).not.toBeNull()
    })

    it('should return null if not found', async () => {
      const found = await repository.findByCnpj('00000000000000')

      expect(found).toBeNull()
    })
  })

  describe('exists', () => {
    it('should return true if lead exists', async () => {
      const lead = createValidLead()
      await repository.save(lead)

      const exists = await repository.exists(lead.id!)

      expect(exists).toBe(true)
    })

    it('should return false if lead does not exist', async () => {
      const exists = await repository.exists(randomUUID())

      expect(exists).toBe(false)
    })
  })

  describe('existsByCompanyName', () => {
    it('should return true if company name exists', async () => {
      await repository.save(createValidLead({ companyName: 'Empresa Única' }))

      const exists = await repository.existsByCompanyName('Empresa Única')

      expect(exists).toBe(true)
    })

    it('should return false if company name does not exist', async () => {
      const exists = await repository.existsByCompanyName('Não Existe')

      expect(exists).toBe(false)
    })

    it('should return false for deleted leads', async () => {
      const lead = createValidLead({ companyName: 'Empresa Deletada' })
      await repository.save(lead)
      const savedLead = await repository.findById(lead.id!)
      await repository.delete(savedLead!)

      const exists = await repository.existsByCompanyName('Empresa Deletada')

      expect(exists).toBe(false)
    })
  })

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      await repository.save(createValidLead({ email: 'existe@email.com' }))

      const exists = await repository.existsByEmail('existe@email.com')

      expect(exists).toBe(true)
    })

    it('should return false if email does not exist', async () => {
      const exists = await repository.existsByEmail('naoexiste@email.com')

      expect(exists).toBe(false)
    })
  })

  describe('clear', () => {
    it('should remove all items', async () => {
      await repository.save(createValidLead())
      await repository.save(createValidLead())

      repository.clear()

      expect(repository.getItems()).toHaveLength(0)
    })
  })
})
