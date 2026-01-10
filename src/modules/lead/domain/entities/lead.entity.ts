import {
  AggregateRoot,
  DefaultEntityProps
} from '@modules/core/domain/entities'
import { CompanySize, LeadSource, LeadStage, LeadTemperature } from '../enums'
import {
  LeadId,
  NameVO,
  PhoneVO,
  EmailVO,
  AddressVO,
  ClassificationVO,
  LeadCategoryId,
  EnrichmentStatusVO,
  DecisionMakerVO,
  LeadScoreVO,
  GoogleMapsDataVO,
  CnpjDataVO
} from '../valueObject'
import { ValueObject } from '@modules/core/domain/valueObject'
import { AddressProps } from './contracts'
import { LeadFakeBuilder } from '@modules/lead/tests/lead.fake-builder'

type CreateLeadCommand = {
  leadCategoryId: string
  companyName: string
  source: LeadSource
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressProps
}

// Comando específico para Google Maps (já traz mais dados)
type CreateLeadFromGoogleMapsCommand = {
  leadCategoryId: string
  companyName: string

  // Dados que sempre vêm do Google
  googlePlaceId: string
  googleCategory: string

  // Opcionais do Google
  phone?: string
  website?: string
  address?: AddressProps
  rating?: number
  reviewsCount?: number
}
interface LeadProps extends DefaultEntityProps {
  id?: LeadId
  leadCategoryId: LeadCategoryId // ← Referência por ID, não entidade

  // Dados básicos
  companyName: NameVO
  tradeName?: string
  phone?: PhoneVO
  email?: EmailVO
  website?: string
  address?: AddressVO

  // Classificação inferida
  sizeClassification?: ClassificationVO

  // Dados de fontes externas (VOs)
  googleMapsData?: GoogleMapsDataVO
  cnpjWsData?: CnpjDataVO
  apolloData?: EnrichmentStatusVO
  hunterData?: EnrichmentStatusVO
  linkedinData?: EnrichmentStatusVO
  decisionMakers: DecisionMakerVO[]

  // Tracking
  enrichmentStatus: EnrichmentStatusVO
  score: LeadScoreVO
  temperature: LeadTemperature
  stage: LeadStage
  source: LeadSource
}
export class LeadEntity extends AggregateRoot {
  _leadCategoryId: LeadCategoryId
  _companyName: NameVO
  _tradeName?: string
  _phone?: PhoneVO
  _email?: EmailVO
  _website?: string
  _address?: AddressVO
  _sizeClassification?: ClassificationVO
  _googleMapsData?: GoogleMapsDataVO
  _cnpjWsData?: CnpjDataVO
  _decisionMakers: DecisionMakerVO[]
  _enrichmentStatus: EnrichmentStatusVO
  _score: LeadScoreVO
  _temperature: keyof typeof LeadTemperature
  _stage: LeadStage
  _source: LeadSource
  get entity_id(): ValueObject {
    return this._leadCategoryId
  }
  toJSON() {
    return {
      id: this.id.id,
      leadCategoryId: this._leadCategoryId.id,
      companyName: this._companyName.value,
      tradeName: this._tradeName,
      phone: this._phone,
      email: this._email,
      website: this._website,
      address: this._address,
      sizeClassification: this._sizeClassification,
      googleMapsData: this._googleMapsData,
      cnpjWsData: this._cnpjWsData,
      decisionMakers: this._decisionMakers,
      enrichmentStatus: this._enrichmentStatus,
      score: this._score,
      temperature: this._temperature,
      stage: this._stage,
      source: this._source
    }
  }
  constructor({
    leadCategoryId,
    companyName,
    tradeName,
    phone,
    email,
    website,
    address,
    sizeClassification,
    googleMapsData,
    cnpjWsData,
    decisionMakers,
    enrichmentStatus,
    score,
    temperature,
    stage,
    source,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: LeadProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._leadCategoryId = new LeadCategoryId(leadCategoryId.id)
    this._companyName = NameVO.create(companyName.value)
    this._tradeName = tradeName
    this._phone = phone ? PhoneVO.create(phone.value) : undefined
    this._email = email ? EmailVO.create(email.value) : undefined
    this._website = website
    this._address = address ? AddressVO.create(address.value) : undefined
    this._sizeClassification = sizeClassification
      ? ClassificationVO.create(sizeClassification)
      : undefined
    this._googleMapsData = googleMapsData
      ? GoogleMapsDataVO.create({
          placeId: googleMapsData.placeId,
          category: googleMapsData.category,
          rating: googleMapsData.rating,
          reviewsCount: googleMapsData.reviewsCount
        })
      : undefined
    this._cnpjWsData = cnpjWsData ? CnpjDataVO.create(cnpjWsData) : undefined

    this._decisionMakers = decisionMakers.map(decisionMaker =>
      DecisionMakerVO.create({
        name: decisionMaker.name,
        email: decisionMaker.email?.value,
        phone: decisionMaker.phone?.value,
        role: decisionMaker.role,
        linkedinUrl: decisionMaker.linkedinUrl,
        source: decisionMaker.source,
        isPrimary: decisionMaker.isPrimary
      })
    )
    this._enrichmentStatus = enrichmentStatus
      ? EnrichmentStatusVO.create(enrichmentStatus)
      : undefined
    this._score = LeadScoreVO.create(score)
    this._temperature = temperature as unknown as keyof typeof LeadTemperature
    this._stage = stage as unknown as LeadStage
    this._source = source as unknown as LeadSource
  }

  // -------------------- Factory Methods --------------------

  static reconstitute(props: LeadProps): LeadEntity {
    return new LeadEntity(props)
  }

  static create(cmd: CreateLeadCommand): LeadEntity {
    return new LeadEntity({
      leadCategoryId: new LeadCategoryId(cmd.leadCategoryId),
      companyName: NameVO.create(cmd.companyName),
      source: cmd.source,
      decisionMakers: [],
      enrichmentStatus: EnrichmentStatusVO.create({
        googleMaps: { enriched: false },
        cnpjWs: { enriched: false },
        apollo: { enriched: false },
        hunter: { enriched: false },
        linkedin: { enriched: false }
      }),
      score: LeadScoreVO.create({
        completeness: 0,
        icpFit: 0,
        engagement: 0
      }),
      temperature: LeadTemperature.COLD,
      stage: LeadStage.NEW
    })
  }

  static createFromGoogleMaps(
    cmd: CreateLeadFromGoogleMapsCommand
  ): LeadEntity {
    return new LeadEntity({
      leadCategoryId: new LeadCategoryId(cmd.leadCategoryId),
      companyName: NameVO.create(cmd.companyName),
      source: LeadSource.GOOGLE_MAPS,

      // Dados do Google
      googleMapsData: GoogleMapsDataVO.create({
        placeId: cmd.googlePlaceId,
        category: cmd.googleCategory,
        rating: cmd.rating,
        reviewsCount: cmd.reviewsCount
      }),

      // Opcionais
      phone: cmd.phone ? PhoneVO.create(cmd.phone) : undefined,
      website: cmd.website,
      address: cmd.address ? AddressVO.create(cmd.address) : undefined,

      // ⬇️ Inicializados automaticamente
      decisionMakers: [],
      enrichmentStatus: EnrichmentStatusVO.create({
        googleMaps: { enriched: true },
        cnpjWs: { enriched: false },
        apollo: { enriched: false },
        hunter: { enriched: false },
        linkedin: { enriched: false }
      }),
      score: LeadScoreVO.create({
        completeness: 0,
        icpFit: 0,
        engagement: 0
      }),
      temperature: LeadTemperature.COLD,
      stage: LeadStage.NEW
    })
  }

  static fake() {
    return LeadFakeBuilder
  }

  // -------------------- END Factory Methods --------------------

  // -------------------- Enrichment Methods --------------------
  enrichWithCnpj(data: CnpjDataVO): void {
    this._cnpjWsData = CnpjDataVO.create(data)
    this._enrichmentStatus = this._enrichmentStatus.markEnriched('cnpjWs')
    this.recalculateScore()
    this.touch()
  }

  addDecisionMaker(decisionMaker: DecisionMakerVO): void {
    // Não adiciona duplicado (mesmo email ou mesmo nome+cargo)
    const exists = this._decisionMakers.some(
      dm =>
        (dm.email &&
          decisionMaker.email &&
          dm.email.value === decisionMaker.email.value) ||
        (dm.name === decisionMaker.name && dm.role === decisionMaker.role)
    )

    if (!exists) {
      this._decisionMakers = [...this._decisionMakers, decisionMaker]

      // Se veio com email, marca a fonte como enriquecida
      if (decisionMaker.email) {
        this._email = decisionMaker.email // Email principal = primeiro com email
      }

      this.recalculateScore()
      this.touch()
    }
  }

  markEnrichedFrom(source: 'apollo' | 'hunter' | 'linkedin'): void {
    this._enrichmentStatus = this._enrichmentStatus.markEnriched(source)
    this.touch()
  }

  // -------------------- END Enrichment Methods --------------------

  // -------------------- Classification Methods --------------------

  classifySize(
    size: CompanySize,
    confidence: number,
    method: 'keywords' | 'ai' | 'manual'
  ): void {
    this._sizeClassification = ClassificationVO.create({
      value: size,
      confidence: confidence,
      method: method
    })
    this.recalculateScore()
    this.touch()
  }

  // -------------------- END Classification Methods --------------------

  // -------------------- Stage Management --------------------

  moveToStage(stage: LeadStage): void {
    // Validação de transições válidas (simplificada)
    this._stage = stage as unknown as LeadStage
    this.recalculateTemperature()
    this.touch()
  }

  discard(): void {
    this._stage = LeadStage.DISCARDED as unknown as LeadStage
    this._temperature =
      LeadTemperature.DISCARDED as unknown as keyof typeof LeadTemperature
    this.touch()
  }

  // -------------------- END Stage Management --------------------

  // -------------------- Score & Temperature --------------------

  private recalculateScore(): void {
    const completeness = this.calculateCompleteness()
    const icpFit = this.calculateIcpFit()
    this._score = LeadScoreVO.create({
      completeness,
      icpFit,
      engagement: this._score.engagement
    })
  }

  private calculateCompleteness(): number {
    let score = 0

    if (this._phone) score += 15
    if (this._email) score += 20
    if (this._website) score += 10
    if (this._address) score += 10
    if (this._cnpjWsData) score += 15
    if (this._decisionMakers.length > 0) score += 20
    if (this._decisionMakers.some(dm => dm.hasContactInfo())) score += 10

    return Math.min(100, score)
  }

  private calculateIcpFit(): number {
    let score = 50 // Base

    // Google rating
    if (this._googleMapsData?.hasGoodRating()) score += 15
    if (this._googleMapsData?.hasSignificantReviews()) score += 10

    // Tempo de mercado
    const years = this._cnpjWsData?.yearsInBusiness() ?? 0
    if (years >= 2) score += 10
    if (years >= 5) score += 10

    // Decisor encontrado
    if (this._decisionMakers.some(dm => dm.isPrimary && dm.hasContactInfo())) {
      score += 15
    }

    return Math.min(100, score)
  }

  private recalculateTemperature(): void {
    const totalScore = this._score.total()

    if (this._stage === LeadStage.DISCARDED) {
      this._temperature =
        LeadTemperature.DISCARDED as unknown as keyof typeof LeadTemperature
    } else if (totalScore >= 70 || this._stage === LeadStage.REPLIED) {
      this._temperature =
        LeadTemperature.HOT as unknown as keyof typeof LeadTemperature
    } else if (totalScore >= 40) {
      this._temperature =
        LeadTemperature.WARM as unknown as keyof typeof LeadTemperature
    } else {
      this._temperature =
        LeadTemperature.COLD as unknown as keyof typeof LeadTemperature
    }
  }

  // -------------------- END Score & Temperature --------------------

  // -------------------- Query Methods --------------------

  needsEnrichmentFrom(
    source: 'cnpjWs' | 'apollo' | 'hunter' | 'linkedin'
  ): boolean {
    return this._enrichmentStatus.needsEnrichment(source)
  }

  getPrimaryDecisionMaker(): DecisionMakerVO | undefined {
    return (
      this._decisionMakers.find(dm => dm.isPrimary) || this._decisionMakers[0]
    )
  }

  hasContactableDecisionMaker(): boolean {
    return this._decisionMakers.some(dm => dm.hasContactInfo())
  }

  isReadyForOutreach(): boolean {
    return (
      this._stage === LeadStage.READY &&
      this.hasContactableDecisionMaker() &&
      this._temperature !==
        (LeadTemperature.DISCARDED as unknown as keyof typeof LeadTemperature)
    )
  }
}
