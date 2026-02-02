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

  describe('findByCnpjRaw', () => {
    it('should return full company data by CNPJ', async () => {
      const basicCnpj = '12345678'

      // Setup establishment
      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '90',
        trade_name: 'Empresa ABC',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        activity_start_date: '2020-01-15',
        ddd1: '11',
        phone1: '987654321',
        email: 'contato@empresa.com',
        street_type: 'Rua',
        street: 'das Flores',
        number: '123',
        complement: 'Sala 1',
        neighborhood: 'Centro',
        zip_code: '01234567',
        state: 'SP',
        city_code: '3550308',
        country_code: '105',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      // Setup company
      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'Empresa ABC LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '100000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      // Setup partner
      await repository.createPartner({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        partner_name: 'João Silva',
        partner_doc: '12345678901',
        partner_qualification: '49',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      // Setup municipality
      await repository.createMunicipality({
        id: randomUUID(),
        code: '3550308',
        name: 'São Paulo',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      // Setup country
      await repository.createCountry({
        id: randomUUID(),
        code: '105',
        name: 'Brasil',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCnpjRaw(basicCnpj)

      expect(result).not.toBeNull()
      expect(result!.basicCnpj).toBe(basicCnpj)
      expect(result!.cnpjOrder).toBe('0001')
      expect(result!.cnpjDv).toBe('90')
      expect(result!.companyName).toBe('Empresa ABC LTDA')
      expect(result!.legalNatureCode).toBe('2062')
      expect(result!.socialCapital).toBe('100000')
      expect(result!.companySize).toBe('ME')
      expect(result!.tradeName).toBe('Empresa ABC')
      expect(result!.registrationStatus).toBe('ativa')
      expect(result!.activityStartDate).toBe('2020-01-15')
      expect(result!.mainCnae).toBe('6201500')
      expect(result!.phone).toBe('11987654321')
      expect(result!.email).toBe('contato@empresa.com')
      expect(result!.street).toBe('Rua das Flores')
      expect(result!.number).toBe('123')
      expect(result!.complement).toBe('Sala 1')
      expect(result!.neighborhood).toBe('Centro')
      expect(result!.zipCode).toBe('01234567')
      expect(result!.state).toBe('SP')
      expect(result!.cityCode).toBe('3550308')
      expect(result!.cityName).toBe('São Paulo')
      expect(result!.countryCode).toBe('105')
      expect(result!.countryName).toBe('Brasil')
      expect(result!.partners).toHaveLength(1)
      expect(result!.partners[0].name).toBe('João Silva')
      expect(result!.partners[0].doc).toBe('12345678901')
      expect(result!.partners[0].qualification).toBe('49')
    })

    it('should return multiple partners in partners array', async () => {
      const basicCnpj = '87654321'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '10',
        trade_name: 'Empresa XYZ',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'Empresa XYZ LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '50000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createPartner({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        partner_name: 'Maria Santos',
        partner_doc: '11111111111',
        partner_qualification: '49',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createPartner({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        partner_name: 'Pedro Oliveira',
        partner_doc: '22222222222',
        partner_qualification: '22',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCnpjRaw(basicCnpj)

      expect(result).not.toBeNull()
      expect(result!.partners).toHaveLength(2)
      expect(result!.partners.map(p => p.name)).toContain('Maria Santos')
      expect(result!.partners.map(p => p.name)).toContain('Pedro Oliveira')
    })

    it('should normalize CNPJ removing non-digits', async () => {
      const basicCnpj = '33581425'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '79',
        trade_name: 'Test Company',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'Test Company LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '200000',
        company_size: 'EPP',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCnpjRaw('335.814.25')

      expect(result).not.toBeNull()
      expect(result!.basicCnpj).toBe(basicCnpj)
    })

    it('should return null if CNPJ not found', async () => {
      const result = await repository.findByCnpjRaw('00000000')

      expect(result).toBeNull()
    })

    it('should return null if no company exists', async () => {
      const basicCnpj = '11111111'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '00',
        trade_name: 'Orphan Establishment',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCnpjRaw(basicCnpj)

      expect(result).toBeNull()
    })

    it('should return data even without partners', async () => {
      const basicCnpj = '99999999'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '00',
        trade_name: 'No Partners Company',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'No Partners LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '10000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCnpjRaw(basicCnpj)

      expect(result).not.toBeNull()
      expect(result!.companyName).toBe('No Partners LTDA')
      expect(result!.partners).toHaveLength(0)
    })
  })

  describe('findByCompanyNameRaw', () => {
    it('should find companies by partial name match', async () => {
      const basicCnpj = '12345678'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '90',
        trade_name: 'Tech Solutions',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'R MAIA SOLUTION LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '100000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCompanyNameRaw('maia')

      expect(result).toHaveLength(1)
      expect(result[0].companyName).toBe('R MAIA SOLUTION LTDA')
    })

    it('should be case-insensitive', async () => {
      const basicCnpj = '87654321'

      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        cnpj_order: '0001',
        cnpj_dv: '10',
        trade_name: 'Acme Corp',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: basicCnpj,
        company_name: 'ACME CORPORATION LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '50000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCompanyNameRaw('acme')

      expect(result).toHaveLength(1)
      expect(result[0].companyName).toBe('ACME CORPORATION LTDA')
    })

    it('should return multiple matches', async () => {
      // Company 1
      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: '11111111',
        cnpj_order: '0001',
        cnpj_dv: '00',
        trade_name: 'Tech 1',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: '11111111',
        company_name: 'TECNOLOGIA ALPHA LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '100000',
        company_size: 'ME',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      // Company 2
      await repository.createEstablishment({
        id: randomUUID(),
        basic_cnpj: '22222222',
        cnpj_order: '0001',
        cnpj_dv: '00',
        trade_name: 'Tech 2',
        branch_type: 'matriz',
        registration_status: 'ativa',
        main_cnae: '6201500',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      await repository.createCompany({
        id: randomUUID(),
        basic_cnpj: '22222222',
        company_name: 'TECNOLOGIA BETA LTDA',
        legal_nature_code: '2062',
        responsible_qualification: '05',
        social_capital: '200000',
        company_size: 'EPP',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isActive: true,
        isBlocked: false
      })

      const result = await repository.findByCompanyNameRaw('tecnologia')

      expect(result).toHaveLength(2)
      expect(result.map(r => r.companyName)).toContain('TECNOLOGIA ALPHA LTDA')
      expect(result.map(r => r.companyName)).toContain('TECNOLOGIA BETA LTDA')
    })

    it('should respect limit parameter', async () => {
      // Create 3 companies
      for (let i = 1; i <= 3; i++) {
        const basicCnpj = `${i}${i}${i}${i}${i}${i}${i}${i}`

        await repository.createEstablishment({
          id: randomUUID(),
          basic_cnpj: basicCnpj,
          cnpj_order: '0001',
          cnpj_dv: '00',
          trade_name: `Software ${i}`,
          branch_type: 'matriz',
          registration_status: 'ativa',
          main_cnae: '6201500',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          isActive: true,
          isBlocked: false
        })

        await repository.createCompany({
          id: randomUUID(),
          basic_cnpj: basicCnpj,
          company_name: `SOFTWARE HOUSE ${i} LTDA`,
          legal_nature_code: '2062',
          responsible_qualification: '05',
          social_capital: '100000',
          company_size: 'ME',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          isActive: true,
          isBlocked: false
        })
      }

      const result = await repository.findByCompanyNameRaw('software', 2)

      expect(result).toHaveLength(2)
    })

    it('should return empty array if no match found', async () => {
      const result = await repository.findByCompanyNameRaw('xyz123notfound')

      expect(result).toHaveLength(0)
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
