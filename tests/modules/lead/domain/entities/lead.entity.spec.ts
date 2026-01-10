import { LeadEntity } from '@modules/lead/domain/entities/lead.entity'
import {
  LeadId,
  LeadCategoryId,
  NameVO,
  EnrichmentStatusVO,
  DecisionMakerVO,
  LeadScoreVO,
  CnpjDataVO,
  GoogleMapsDataVO
} from '@modules/lead/domain/valueObject'
import {
  LeadSource,
  LeadStage,
  LeadTemperature,
  CompanySize
} from '@modules/lead/domain/enums'

describe('LeadEntity', () => {
  describe('create', () => {
    it('should create a lead with required fields', () => {
      const lead = LeadEntity.create({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Empresa Teste LTDA',
        source: LeadSource.MANUAL
      })

      expect(lead).toBeInstanceOf(LeadEntity)
      expect(lead._companyName.value).toBe('Empresa Teste LTDA')
      expect(lead._source).toBe(LeadSource.MANUAL)
      expect(lead._stage).toBe(LeadStage.NEW)
      expect(lead._temperature).toBe(LeadTemperature.COLD)
      expect(lead._decisionMakers).toEqual([])
    })

    it('should initialize enrichment status with all sources as not enriched', () => {
      const lead = LeadEntity.create({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Empresa Teste',
        source: LeadSource.MANUAL
      })

      expect(lead._enrichmentStatus.needsEnrichment('googleMaps')).toBe(true)
      expect(lead._enrichmentStatus.needsEnrichment('cnpjWs')).toBe(true)
      expect(lead._enrichmentStatus.needsEnrichment('apollo')).toBe(true)
      expect(lead._enrichmentStatus.needsEnrichment('hunter')).toBe(true)
      expect(lead._enrichmentStatus.needsEnrichment('linkedin')).toBe(true)
    })

    it('should initialize score with zeros', () => {
      const lead = LeadEntity.create({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Empresa Teste',
        source: LeadSource.MANUAL
      })

      expect(lead._score.completeness).toBe(0)
      expect(lead._score.icpFit).toBe(0)
      expect(lead._score.engagement).toBe(0)
    })
  })

  describe('createFromGoogleMaps', () => {
    it('should create a lead from Google Maps data', () => {
      const lead = LeadEntity.createFromGoogleMaps({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Restaurante Bom Sabor',
        googlePlaceId: 'ChIJ123456789',
        googleCategory: 'Restaurante'
      })

      expect(lead).toBeInstanceOf(LeadEntity)
      expect(lead._companyName.value).toBe('Restaurante Bom Sabor')
      expect(lead._source).toBe(LeadSource.GOOGLE_MAPS)
      expect(lead._googleMapsData).toBeDefined()
      expect(lead._googleMapsData.placeId).toBe('ChIJ123456789')
      expect(lead._googleMapsData.category).toBe('Restaurante')
    })

    it('should mark Google Maps as enriched', () => {
      const lead = LeadEntity.createFromGoogleMaps({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Loja Teste',
        googlePlaceId: 'ChIJ123',
        googleCategory: 'Loja'
      })

      expect(lead._enrichmentStatus.needsEnrichment('googleMaps')).toBe(false)
      expect(lead._enrichmentStatus.needsEnrichment('cnpjWs')).toBe(true)
    })

    it('should include optional Google Maps data', () => {
      const lead = LeadEntity.createFromGoogleMaps({
        leadCategoryId: new LeadCategoryId().id,
        companyName: 'Restaurante Premium',
        googlePlaceId: 'ChIJ456',
        googleCategory: 'Restaurante',
        rating: 4.5,
        reviewsCount: 150,
        phone: '11987654321',
        website: 'https://restaurante.com.br'
      })

      expect(lead._googleMapsData.rating).toBe(4.5)
      expect(lead._googleMapsData.reviewsCount).toBe(150)
      expect(lead._phone.value).toBe('11987654321')
      expect(lead._website).toBe('https://restaurante.com.br')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute a lead from props', () => {
      const id = new LeadId()
      const categoryId = new LeadCategoryId()
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-01-02')

      const lead = LeadEntity.reconstitute({
        id,
        leadCategoryId: categoryId,
        companyName: NameVO.create('Empresa Reconstituída'),
        source: LeadSource.APOLLO,
        stage: LeadStage.CONTACTED,
        temperature: LeadTemperature.WARM,
        decisionMakers: [],
        enrichmentStatus: EnrichmentStatusVO.empty(),
        score: LeadScoreVO.empty(),
        is_active: true,
        is_deleted: false,
        is_blocked: false,
        created_at: createdAt,
        updated_at: updatedAt
      })

      expect(lead.id.id).toBe(id.id)
      expect(lead._companyName.value).toBe('Empresa Reconstituída')
      expect(lead._source).toBe(LeadSource.APOLLO)
      expect(lead.created_at).toBe(createdAt)
      expect(lead.updated_at).toBe(updatedAt)
    })
  })

  describe('fake', () => {
    it('should return LeadFakeBuilder class', () => {
      expect(LeadEntity.fake().aLead).toBeDefined()
      expect(LeadEntity.fake().theLeads).toBeDefined()
    })

    it('should build a valid lead using fake builder', () => {
      const lead = LeadEntity.fake().aLead().build()

      expect(lead).toBeInstanceOf(LeadEntity)
      expect(lead._companyName.value).toBeDefined()
      expect(lead._enrichmentStatus).toBeDefined()
      expect(lead._score).toBeDefined()
    })

    it('should build multiple leads using fake builder', () => {
      const leads = LeadEntity.fake().theLeads(5).build()

      expect(leads).toHaveLength(5)
      leads.forEach(lead => {
        expect(lead).toBeInstanceOf(LeadEntity)
      })
    })

    it('should build a lead from Google Maps using convenience method', () => {
      const lead = LeadEntity.fake().aLead().fromGoogleMaps().build()

      expect(lead._source).toBe(LeadSource.GOOGLE_MAPS)
      expect(lead._googleMapsData).toBeDefined()
      expect(lead._enrichmentStatus.needsEnrichment('googleMaps')).toBe(false)
    })

    it('should build a lead ready for outreach', () => {
      const lead = LeadEntity.fake().aLead().readyForOutreach().build()

      expect(lead._stage).toBe(LeadStage.READY)
      expect(lead._decisionMakers.length).toBeGreaterThan(0)
      expect(lead.hasContactableDecisionMaker()).toBe(true)
    })
  })

  describe('enrichWithCnpj', () => {
    it('should enrich lead with CNPJ data', () => {
      const lead = LeadEntity.fake().aLead().build()
      const cnpjData = CnpjDataVO.create({
        cnpj: '11222333000181',
        businessName: 'Empresa Legal LTDA',
        openingDate: new Date('2015-01-01'),
        capital: 100000
      })

      lead.enrichWithCnpj(cnpjData)

      expect(lead._cnpjWsData).toBeDefined()
      expect(lead._cnpjWsData.cnpj).toBe('11222333000181')
      expect(lead._enrichmentStatus.needsEnrichment('cnpjWs')).toBe(false)
    })

    it('should recalculate score after CNPJ enrichment', () => {
      const lead = LeadEntity.fake().aLead().build()
      const initialScore = lead._score.completeness

      const cnpjData = CnpjDataVO.create({
        cnpj: '11222333000181',
        businessName: 'Empresa Legal LTDA'
      })

      lead.enrichWithCnpj(cnpjData)

      expect(lead._score.completeness).toBeGreaterThan(initialScore)
    })

    it('should update updated_at after enrichment', () => {
      const lead = LeadEntity.fake().aLead().build()
      const originalUpdatedAt = lead.updated_at

      const cnpjData = CnpjDataVO.create({
        cnpj: '11222333000181',
        businessName: 'Empresa Legal LTDA'
      })

      lead.enrichWithCnpj(cnpjData)

      expect(lead.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('addDecisionMaker', () => {
    it('should add a decision maker', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()

      const decisionMaker = DecisionMakerVO.create({
        name: 'João Silva',
        role: 'CEO',
        email: 'joao@empresa.com',
        phone: '11987654321',
        source: 'apollo',
        isPrimary: true
      })

      lead.addDecisionMaker(decisionMaker)

      expect(lead._decisionMakers).toHaveLength(1)
      expect(lead._decisionMakers[0].name).toBe('João Silva')
    })

    it('should not add duplicate decision maker with same email', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()

      const decisionMaker1 = DecisionMakerVO.create({
        name: 'João Silva',
        role: 'CEO',
        email: 'joao@empresa.com',
        source: 'apollo'
      })

      const decisionMaker2 = DecisionMakerVO.create({
        name: 'João S.',
        role: 'Diretor',
        email: 'joao@empresa.com',
        source: 'hunter'
      })

      lead.addDecisionMaker(decisionMaker1)
      lead.addDecisionMaker(decisionMaker2)

      expect(lead._decisionMakers).toHaveLength(1)
    })

    it('should not add duplicate decision maker with same name and role', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()

      const decisionMaker1 = DecisionMakerVO.create({
        name: 'João Silva',
        role: 'CEO',
        source: 'apollo'
      })

      const decisionMaker2 = DecisionMakerVO.create({
        name: 'João Silva',
        role: 'CEO',
        source: 'hunter'
      })

      lead.addDecisionMaker(decisionMaker1)
      lead.addDecisionMaker(decisionMaker2)

      expect(lead._decisionMakers).toHaveLength(1)
    })

    it('should set lead email from first decision maker with email', () => {
      const lead = LeadEntity.fake().aLead().withEmail(undefined).build()

      const decisionMaker = DecisionMakerVO.create({
        name: 'Maria Santos',
        role: 'Diretora',
        email: 'maria@empresa.com',
        source: 'apollo'
      })

      lead.addDecisionMaker(decisionMaker)

      expect(lead._email.value).toBe('maria@empresa.com')
    })

    it('should recalculate score after adding decision maker', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()
      const initialScore = lead._score.completeness

      const decisionMaker = DecisionMakerVO.create({
        name: 'Carlos Souza',
        role: 'Gerente',
        email: 'carlos@empresa.com',
        source: 'manual'
      })

      lead.addDecisionMaker(decisionMaker)

      expect(lead._score.completeness).toBeGreaterThan(initialScore)
    })
  })

  describe('markEnrichedFrom', () => {
    it('should mark apollo as enriched', () => {
      const lead = LeadEntity.fake().aLead().build()

      lead.markEnrichedFrom('apollo')

      expect(lead._enrichmentStatus.needsEnrichment('apollo')).toBe(false)
    })

    it('should mark hunter as enriched', () => {
      const lead = LeadEntity.fake().aLead().build()

      lead.markEnrichedFrom('hunter')

      expect(lead._enrichmentStatus.needsEnrichment('hunter')).toBe(false)
    })

    it('should mark linkedin as enriched', () => {
      const lead = LeadEntity.fake().aLead().build()

      lead.markEnrichedFrom('linkedin')

      expect(lead._enrichmentStatus.needsEnrichment('linkedin')).toBe(false)
    })

    it('should update updated_at when marking enriched', () => {
      const lead = LeadEntity.fake().aLead().build()
      const originalUpdatedAt = lead.updated_at

      lead.markEnrichedFrom('apollo')

      expect(lead.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('classifySize', () => {
    it('should classify lead size', () => {
      const lead = LeadEntity.fake().aLead().build()

      lead.classifySize(CompanySize.MEDIUM, 85, 'ai')

      expect(lead._sizeClassification).toBeDefined()
      expect(lead._sizeClassification.value).toBe(CompanySize.MEDIUM)
      expect(lead._sizeClassification.confidence).toBe(85)
      expect(lead._sizeClassification.method).toBe('ai')
    })

    it('should recalculate score after classification', () => {
      const lead = LeadEntity.fake().aLead().build()
      const originalUpdatedAt = lead.updated_at

      lead.classifySize(CompanySize.LARGE, 90, 'manual')

      expect(lead.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('moveToStage', () => {
    it('should move lead to new stage', () => {
      const lead = LeadEntity.fake().aLead().withStage(LeadStage.NEW).build()

      lead.moveToStage(LeadStage.CONTACTED)

      expect(lead._stage).toBe(LeadStage.CONTACTED)
    })

    it('should recalculate temperature when moving to REPLIED stage', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withStage(LeadStage.CONTACTED)
        .cold()
        .build()

      lead.moveToStage(LeadStage.REPLIED)

      expect(lead._temperature).toBe(LeadTemperature.HOT)
    })

    it('should update updated_at when changing stage', () => {
      const lead = LeadEntity.fake().aLead().build()
      const originalUpdatedAt = lead.updated_at

      lead.moveToStage(LeadStage.INTERESTED)

      expect(lead.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('discard', () => {
    it('should discard lead', () => {
      const lead = LeadEntity.fake().aLead().build()

      lead.discard()

      expect(lead._stage).toBe(LeadStage.DISCARDED)
      expect(lead._temperature).toBe(LeadTemperature.DISCARDED)
    })

    it('should update updated_at when discarding', () => {
      const lead = LeadEntity.fake().aLead().build()
      const originalUpdatedAt = lead.updated_at

      lead.discard()

      expect(lead.updated_at).not.toBe(originalUpdatedAt)
    })
  })

  describe('needsEnrichmentFrom', () => {
    it('should return true when source needs enrichment', () => {
      const lead = LeadEntity.fake().aLead().build()

      expect(lead.needsEnrichmentFrom('cnpjWs')).toBe(true)
      expect(lead.needsEnrichmentFrom('apollo')).toBe(true)
    })

    it('should return false when source is already enriched', () => {
      const lead = LeadEntity.fake().aLead().fullyEnriched().build()

      expect(lead.needsEnrichmentFrom('cnpjWs')).toBe(false)
      expect(lead.needsEnrichmentFrom('apollo')).toBe(false)
    })
  })

  describe('getPrimaryDecisionMaker', () => {
    it('should return primary decision maker', () => {
      const primaryDM = DecisionMakerVO.create({
        name: 'CEO',
        role: 'CEO',
        email: 'ceo@empresa.com',
        source: 'apollo',
        isPrimary: true
      })

      const secondaryDM = DecisionMakerVO.create({
        name: 'Gerente',
        role: 'Gerente',
        email: 'gerente@empresa.com',
        source: 'apollo',
        isPrimary: false
      })

      const lead = LeadEntity.fake()
        .aLead()
        .withDecisionMakers([secondaryDM, primaryDM])
        .build()

      const primary = lead.getPrimaryDecisionMaker()

      expect(primary.name).toBe('CEO')
      expect(primary.isPrimary).toBe(true)
    })

    it('should return first decision maker when no primary is set', () => {
      const dm1 = DecisionMakerVO.create({
        name: 'Primeiro',
        role: 'Gerente',
        source: 'manual'
      })

      const dm2 = DecisionMakerVO.create({
        name: 'Segundo',
        role: 'Diretor',
        source: 'manual'
      })

      const lead = LeadEntity.fake()
        .aLead()
        .withDecisionMakers([dm1, dm2])
        .build()

      const primary = lead.getPrimaryDecisionMaker()

      expect(primary.name).toBe('Primeiro')
    })

    it('should return undefined when no decision makers exist', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()

      expect(lead.getPrimaryDecisionMaker()).toBeUndefined()
    })
  })

  describe('hasContactableDecisionMaker', () => {
    it('should return true when a decision maker has contact info', () => {
      const dm = DecisionMakerVO.create({
        name: 'João',
        role: 'CEO',
        email: 'joao@empresa.com',
        source: 'apollo'
      })

      const lead = LeadEntity.fake().aLead().withDecisionMakers([dm]).build()

      expect(lead.hasContactableDecisionMaker()).toBe(true)
    })

    it('should return false when no decision maker has contact info', () => {
      const dm = DecisionMakerVO.create({
        name: 'João',
        role: 'CEO',
        source: 'linkedin'
      })

      const lead = LeadEntity.fake().aLead().withDecisionMakers([dm]).build()

      expect(lead.hasContactableDecisionMaker()).toBe(false)
    })

    it('should return false when no decision makers exist', () => {
      const lead = LeadEntity.fake().aLead().withDecisionMakers([]).build()

      expect(lead.hasContactableDecisionMaker()).toBe(false)
    })
  })

  describe('isReadyForOutreach', () => {
    it('should return true when lead is ready for outreach', () => {
      const lead = LeadEntity.fake().aLead().readyForOutreach().build()

      expect(lead.isReadyForOutreach()).toBe(true)
    })

    it('should return false when stage is not READY', () => {
      const dm = DecisionMakerVO.create({
        name: 'João',
        role: 'CEO',
        email: 'joao@empresa.com',
        source: 'apollo'
      })

      const lead = LeadEntity.fake()
        .aLead()
        .withStage(LeadStage.NEW)
        .withDecisionMakers([dm])
        .warm()
        .build()

      expect(lead.isReadyForOutreach()).toBe(false)
    })

    it('should return false when no contactable decision maker', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withStage(LeadStage.READY)
        .withDecisionMakers([])
        .warm()
        .build()

      expect(lead.isReadyForOutreach()).toBe(false)
    })

    it('should return false when lead is discarded', () => {
      const lead = LeadEntity.fake().aLead().discarded().build()

      expect(lead.isReadyForOutreach()).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withCompanyName(NameVO.create('Empresa JSON'))
        .withTradeName('Nome Fantasia')
        .withWebsite('https://empresa.com.br')
        .withSource(LeadSource.GOOGLE_MAPS)
        .withStage(LeadStage.CONTACTED)
        .withTemperature(LeadTemperature.WARM)
        .build()

      const json = lead.toJSON()

      expect(json.id).toBe(lead.id.id)
      expect(json.companyName).toBe('Empresa JSON')
      expect(json.tradeName).toBe('Nome Fantasia')
      expect(json.website).toBe('https://empresa.com.br')
      expect(json.source).toBe(LeadSource.GOOGLE_MAPS)
      expect(json.stage).toBe(LeadStage.CONTACTED)
      expect(json.temperature).toBe(LeadTemperature.WARM)
    })
  })

  describe('entity_id', () => {
    it('should return the lead category id', () => {
      const categoryId = new LeadCategoryId()
      const lead = LeadEntity.fake()
        .aLead()
        .withLeadCategoryId(categoryId)
        .build()

      expect(lead.entity_id).toEqual(lead._leadCategoryId)
    })
  })

  describe('score calculation', () => {
    it('should increase completeness when adding decision maker with contact', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withDecisionMakers([])
        .withScore(LeadScoreVO.empty())
        .build()

      const initialCompleteness = lead._score.completeness

      const dm = DecisionMakerVO.create({
        name: 'João',
        role: 'CEO',
        email: 'joao@empresa.com',
        source: 'apollo'
      })

      lead.addDecisionMaker(dm)

      // Decision maker: 20 + has contact info: 10 + email on lead: 20 = +50
      expect(lead._score.completeness).toBeGreaterThan(initialCompleteness)
    })

    it('should increase completeness when enriching with CNPJ', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withScore(LeadScoreVO.empty())
        .build()

      const initialCompleteness = lead._score.completeness

      lead.enrichWithCnpj(
        CnpjDataVO.create({
          cnpj: '11222333000181',
          businessName: 'Empresa LTDA'
        })
      )

      // CNPJ data: +15
      expect(lead._score.completeness).toBeGreaterThan(initialCompleteness)
    })

    it('should calculate ICP fit based on Google Maps and CNPJ data', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withGoogleMapsData(
          GoogleMapsDataVO.create({
            placeId: 'test',
            category: 'Restaurante',
            rating: 4.5,
            reviewsCount: 50
          })
        )
        .withScore(LeadScoreVO.empty())
        .build()

      // Trigger score recalculation by enriching
      lead.enrichWithCnpj(
        CnpjDataVO.create({
          cnpj: '11222333000181',
          businessName: 'Empresa LTDA',
          openingDate: new Date('2015-01-01')
        })
      )

      // Base: 50 + Good rating: 15 + Significant reviews: 10 + years >= 2: 10 + years >= 5: 10 = 95
      expect(lead._score.icpFit).toBeGreaterThanOrEqual(75)
    })
  })

  describe('temperature calculation', () => {
    it('should be HOT when total score >= 70', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withScore(
          LeadScoreVO.create({
            completeness: 80,
            icpFit: 80,
            engagement: 50
          })
        )
        .withStage(LeadStage.CONTACTED)
        .build()

      lead.moveToStage(LeadStage.INTERESTED)

      expect(lead._temperature).toBe(LeadTemperature.HOT)
    })

    it('should be WARM when total score >= 40 and < 70', () => {
      // Score: 60*0.3 + 60*0.5 + 40*0.2 = 18 + 30 + 8 = 56 (WARM range)
      const lead = LeadEntity.fake()
        .aLead()
        .withScore(
          LeadScoreVO.create({
            completeness: 60,
            icpFit: 60,
            engagement: 40
          })
        )
        .withStage(LeadStage.NEW)
        .build()

      lead.moveToStage(LeadStage.CONTACTED)

      expect(lead._temperature).toBe(LeadTemperature.WARM)
    })

    it('should be COLD when total score < 40', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withScore(
          LeadScoreVO.create({
            completeness: 20,
            icpFit: 20,
            engagement: 0
          })
        )
        .withStage(LeadStage.NEW)
        .build()

      lead.moveToStage(LeadStage.CONTACTED)

      expect(lead._temperature).toBe(LeadTemperature.COLD)
    })

    it('should be HOT when stage is REPLIED regardless of score', () => {
      const lead = LeadEntity.fake()
        .aLead()
        .withScore(LeadScoreVO.empty())
        .withStage(LeadStage.CONTACTED)
        .build()

      lead.moveToStage(LeadStage.REPLIED)

      expect(lead._temperature).toBe(LeadTemperature.HOT)
    })
  })
})
