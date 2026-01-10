import { Chance } from 'chance'
import {
  LeadId,
  LeadCategoryId,
  NameVO,
  PhoneVO,
  EmailVO,
  AddressVO,
  ClassificationVO,
  EnrichmentStatusVO,
  DecisionMakerVO,
  LeadScoreVO,
  GoogleMapsDataVO,
  CnpjDataVO
} from '../domain/valueObject'
import { LeadEntity } from '../domain/entities/lead.entity'
import { LeadSource, LeadStage, LeadTemperature } from '../domain/enums'
import { AddressProps } from '../domain/entities/contracts'

type PropertyOrFactory<T> = T | ((index: number) => T)

export class LeadFakeBuilder<TBuild = any> {
  private readonly countsObjs: number
  private readonly chance: Chance.Chance

  private constructor(counts: number = 1) {
    this.countsObjs = counts
    this.chance = new Chance()
  }

  private _id: PropertyOrFactory<LeadId> | undefined = undefined

  private _leadCategoryId: PropertyOrFactory<LeadCategoryId> = () =>
    new LeadCategoryId()

  private _companyName: PropertyOrFactory<NameVO> = () =>
    NameVO.create(this.companyNameGenerate())

  private _tradeName: PropertyOrFactory<string | undefined> = () =>
    this.tradeNameGenerate()

  private _phone: PropertyOrFactory<PhoneVO | undefined> = () =>
    PhoneVO.create(this.phoneGenerate())

  private _email: PropertyOrFactory<EmailVO | undefined> = () =>
    EmailVO.create(this.emailGenerate())

  private _website: PropertyOrFactory<string | undefined> = () =>
    this.websiteGenerate()

  private _address: PropertyOrFactory<AddressVO | undefined> = () =>
    AddressVO.create(this.addressGenerate())

  private _sizeClassification: PropertyOrFactory<ClassificationVO | undefined> =
    () => undefined

  private _googleMapsData: PropertyOrFactory<GoogleMapsDataVO | undefined> =
    () => undefined

  private _cnpjWsData: PropertyOrFactory<CnpjDataVO | undefined> = () =>
    undefined

  private _decisionMakers: PropertyOrFactory<DecisionMakerVO[]> = () => []

  private _enrichmentStatus: PropertyOrFactory<EnrichmentStatusVO> = () =>
    EnrichmentStatusVO.empty()

  private _score: PropertyOrFactory<LeadScoreVO> = () => LeadScoreVO.empty()

  private _temperature: PropertyOrFactory<LeadTemperature> = () =>
    LeadTemperature.COLD

  private _stage: PropertyOrFactory<LeadStage> = () => LeadStage.NEW

  private _source: PropertyOrFactory<LeadSource> = () => LeadSource.MANUAL

  private _is_active: PropertyOrFactory<boolean> = () => true

  private _is_deleted: PropertyOrFactory<boolean> = () => false

  private _is_blocked: PropertyOrFactory<boolean> = () => false

  private _created_at: PropertyOrFactory<Date> | undefined = undefined

  private _updated_at: PropertyOrFactory<Date> | undefined = undefined

  private _deleted_at: PropertyOrFactory<Date> | undefined = undefined

  // ============================================================
  // GENERATORS
  // ============================================================

  private companyNameGenerate(): string {
    const adjective = this.chance.capitalize(this.chance.word({ length: 6 }))
    const noun = this.chance.capitalize(this.chance.word({ length: 8 }))
    const suffix = this.chance.pickone(['Ltda', 'S.A.', 'ME', 'EIRELI', ''])
    return `${adjective} ${noun} ${suffix}`.trim()
  }

  private tradeNameGenerate(): string {
    return this.chance.company()
  }

  private phoneGenerate(): string {
    const ddd = this.chance.pickone([
      '11',
      '21',
      '31',
      '41',
      '51',
      '61',
      '71',
      '81'
    ])
    const number = this.chance.string({ length: 9, pool: '0123456789' })
    return `${ddd}${number}`
  }

  private emailGenerate(): string {
    return this.chance.email({ domain: 'empresa.com.br' })
  }

  private websiteGenerate(): string {
    return `https://www.${this.chance.word({ length: 8 })}.com.br`
  }

  private addressGenerate(): AddressProps {
    return {
      street: this.chance.address(),
      city: this.chance.city(),
      state: this.chance.pickone([
        'SP',
        'RJ',
        'MG',
        'RS',
        'PR',
        'SC',
        'BA',
        'PE'
      ]),
      zipCode: this.chance.zip(),
      neighborhood: this.chance.word({ length: 10 })
    }
  }

  private cnpjGenerate(): string {
    // Gera CNPJ válido
    const n = Array.from({ length: 12 }, () =>
      this.chance.integer({ min: 0, max: 9 })
    )

    // Primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += n[i] * weights1[i]
    }
    const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    n.push(d1)

    // Segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += n[i] * weights2[i]
    }
    const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    n.push(d2)

    return n.join('')
  }

  // ============================================================
  // STATIC CONSTRUCTORS
  // ============================================================

  static aLead(): LeadFakeBuilder<LeadEntity> {
    return new LeadFakeBuilder<LeadEntity>()
  }

  static theLeads(counts: number): LeadFakeBuilder<LeadEntity[]> {
    return new LeadFakeBuilder<LeadEntity[]>(counts)
  }

  // ============================================================
  // BUILD
  // ============================================================

  build(): TBuild {
    const leads = new Array(this.countsObjs).fill(undefined).map((_, index) => {
      return LeadEntity.reconstitute({
        id: this._id ? this.callFactory(this._id, index) : undefined,
        leadCategoryId: this.callFactory(this._leadCategoryId, index),
        companyName: this.callFactory(this._companyName, index),
        tradeName: this.callFactory(this._tradeName, index),
        phone: this.callFactory(this._phone, index),
        email: this.callFactory(this._email, index),
        website: this.callFactory(this._website, index),
        address: this.callFactory(this._address, index),
        sizeClassification: this.callFactory(this._sizeClassification, index),
        googleMapsData: this.callFactory(this._googleMapsData, index),
        cnpjWsData: this.callFactory(this._cnpjWsData, index),
        decisionMakers: this.callFactory(this._decisionMakers, index),
        enrichmentStatus: this.callFactory(this._enrichmentStatus, index),
        score: this.callFactory(this._score, index),
        temperature: this.callFactory(this._temperature, index),
        stage: this.callFactory(this._stage, index),
        source: this.callFactory(this._source, index),
        is_active: this.callFactory(this._is_active, index),
        is_deleted: this.callFactory(this._is_deleted, index),
        is_blocked: this.callFactory(this._is_blocked, index),
        created_at: this._created_at
          ? this.callFactory(this._created_at, index)
          : undefined,
        updated_at: this._updated_at
          ? this.callFactory(this._updated_at, index)
          : undefined,
        deleted_at: this._deleted_at
          ? this.callFactory(this._deleted_at, index)
          : undefined
      })
    })

    return this.countsObjs === 1 ? (leads[0] as TBuild) : (leads as TBuild)
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private getValue(prop: string) {
    const optional = [
      'id',
      'created_at',
      'updated_at',
      'deleted_at',
      'tradeName',
      'phone',
      'email',
      'website',
      'address',
      'sizeClassification',
      'googleMapsData',
      'cnpjWsData'
    ]
    const privateProp = `_${prop}` as keyof this
    if (!this[privateProp] && !optional.includes(prop)) {
      throw new Error(
        `Property ${prop} does not have a factory, use 'with' methods`
      )
    }
    return this.callFactory(this[privateProp] as PropertyOrFactory<any>, 0)
  }

  private callFactory<T>(
    factoryOrValue: PropertyOrFactory<T>,
    index: number
  ): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue
  }

  // ============================================================
  // WITH METHODS - Fluent API
  // ============================================================

  withId(id: PropertyOrFactory<LeadId>): this {
    this._id = id
    return this
  }

  withLeadCategoryId(leadCategoryId: PropertyOrFactory<LeadCategoryId>): this {
    this._leadCategoryId = leadCategoryId
    return this
  }

  withCompanyName(companyName: PropertyOrFactory<NameVO>): this {
    this._companyName = companyName
    return this
  }

  withTradeName(tradeName: PropertyOrFactory<string | undefined>): this {
    this._tradeName = tradeName
    return this
  }

  withPhone(phone: PropertyOrFactory<PhoneVO | undefined>): this {
    this._phone = phone
    return this
  }

  withEmail(email: PropertyOrFactory<EmailVO | undefined>): this {
    this._email = email
    return this
  }

  withWebsite(website: PropertyOrFactory<string | undefined>): this {
    this._website = website
    return this
  }

  withAddress(address: PropertyOrFactory<AddressVO | undefined>): this {
    this._address = address
    return this
  }

  withSizeClassification(
    sizeClassification: PropertyOrFactory<ClassificationVO | undefined>
  ): this {
    this._sizeClassification = sizeClassification
    return this
  }

  withGoogleMapsData(
    googleMapsData: PropertyOrFactory<GoogleMapsDataVO | undefined>
  ): this {
    this._googleMapsData = googleMapsData
    return this
  }

  withCnpjWsData(cnpjWsData: PropertyOrFactory<CnpjDataVO | undefined>): this {
    this._cnpjWsData = cnpjWsData
    return this
  }

  withDecisionMakers(
    decisionMakers: PropertyOrFactory<DecisionMakerVO[]>
  ): this {
    this._decisionMakers = decisionMakers
    return this
  }

  withEnrichmentStatus(
    enrichmentStatus: PropertyOrFactory<EnrichmentStatusVO>
  ): this {
    this._enrichmentStatus = enrichmentStatus
    return this
  }

  withScore(score: PropertyOrFactory<LeadScoreVO>): this {
    this._score = score
    return this
  }

  withTemperature(temperature: PropertyOrFactory<LeadTemperature>): this {
    this._temperature = temperature
    return this
  }

  withStage(stage: PropertyOrFactory<LeadStage>): this {
    this._stage = stage
    return this
  }

  withSource(source: PropertyOrFactory<LeadSource>): this {
    this._source = source
    return this
  }

  withIsActive(isActive: PropertyOrFactory<boolean>): this {
    this._is_active = isActive
    return this
  }

  withIsDeleted(isDeleted: PropertyOrFactory<boolean>): this {
    this._is_deleted = isDeleted
    return this
  }

  withIsBlocked(isBlocked: PropertyOrFactory<boolean>): this {
    this._is_blocked = isBlocked
    return this
  }

  withCreatedAt(createdAt: PropertyOrFactory<Date>): this {
    this._created_at = createdAt
    return this
  }

  withUpdatedAt(updatedAt: PropertyOrFactory<Date>): this {
    this._updated_at = updatedAt
    return this
  }

  withDeletedAt(deletedAt: PropertyOrFactory<Date>): this {
    this._deleted_at = deletedAt
    return this
  }

  // ============================================================
  // CONVENIENCE METHODS
  // ============================================================

  active(): this {
    this._is_active = true
    return this
  }

  inactive(): this {
    this._is_active = false
    return this
  }

  deleted(): this {
    this._is_deleted = true
    this._deleted_at = () => new Date()
    return this
  }

  blocked(): this {
    this._is_blocked = true
    return this
  }

  hot(): this {
    this._temperature = LeadTemperature.HOT
    return this
  }

  warm(): this {
    this._temperature = LeadTemperature.WARM
    return this
  }

  cold(): this {
    this._temperature = LeadTemperature.COLD
    return this
  }

  discarded(): this {
    this._temperature = LeadTemperature.DISCARDED
    this._stage = LeadStage.DISCARDED
    return this
  }

  fromGoogleMaps(): this {
    this._source = LeadSource.GOOGLE_MAPS
    this._googleMapsData = () =>
      GoogleMapsDataVO.create({
        placeId: this.chance.guid(),
        category: this.chance.pickone([
          'Restaurante',
          'Loja',
          'Escritório',
          'Clínica'
        ]),
        rating: this.chance.floating({ min: 3, max: 5, fixed: 1 }),
        reviewsCount: this.chance.integer({ min: 5, max: 500 })
      })
    this._enrichmentStatus = () =>
      EnrichmentStatusVO.create({
        googleMaps: { enriched: true, at: new Date() },
        cnpjWs: { enriched: false },
        apollo: { enriched: false },
        hunter: { enriched: false },
        linkedin: { enriched: false }
      })
    return this
  }

  withValidCnpj(): this {
    this._cnpjWsData = () =>
      CnpjDataVO.create({
        cnpj: this.cnpjGenerate(),
        businessName: this.companyNameGenerate(),
        openingDate: this.chance.date({
          year: this.chance.integer({ min: 2010, max: 2023 })
        }) as Date,
        capital: this.chance.integer({ min: 10000, max: 1000000 })
      })
    this._enrichmentStatus = () =>
      EnrichmentStatusVO.create({
        googleMaps: { enriched: false },
        cnpjWs: { enriched: true, at: new Date() },
        apollo: { enriched: false },
        hunter: { enriched: false },
        linkedin: { enriched: false }
      })
    return this
  }

  withDecisionMaker(): this {
    this._decisionMakers = () => [
      DecisionMakerVO.create({
        name: this.chance.name(),
        role: this.chance.pickone(['CEO', 'Diretor', 'Gerente', 'Sócio']),
        email: this.chance.email(),
        phone: this.phoneGenerate(),
        source: 'manual',
        isPrimary: true
      })
    ]
    return this
  }

  readyForOutreach(): this {
    this._stage = LeadStage.READY
    this._temperature = LeadTemperature.WARM
    this._decisionMakers = () => [
      DecisionMakerVO.create({
        name: this.chance.name(),
        role: 'CEO',
        email: this.chance.email(),
        phone: this.phoneGenerate(),
        source: 'apollo',
        isPrimary: true
      })
    ]
    this._enrichmentStatus = () =>
      EnrichmentStatusVO.create({
        googleMaps: { enriched: true, at: new Date() },
        cnpjWs: { enriched: true, at: new Date() },
        apollo: { enriched: true, at: new Date() },
        hunter: { enriched: false },
        linkedin: { enriched: false }
      })
    this._score = () =>
      LeadScoreVO.create({
        completeness: 80,
        icpFit: 70,
        engagement: 0
      })
    return this
  }

  fullyEnriched(): this {
    this._enrichmentStatus = () =>
      EnrichmentStatusVO.create({
        googleMaps: { enriched: true, at: new Date() },
        cnpjWs: { enriched: true, at: new Date() },
        apollo: { enriched: true, at: new Date() },
        hunter: { enriched: true, at: new Date() },
        linkedin: { enriched: true, at: new Date() }
      })
    return this
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get id() {
    return this.getValue('id')
  }

  get leadCategoryId() {
    return this.getValue('leadCategoryId')
  }

  get companyName() {
    return this.getValue('companyName')
  }

  get tradeName() {
    return this.getValue('tradeName')
  }

  get phone() {
    return this.getValue('phone')
  }

  get email() {
    return this.getValue('email')
  }

  get website() {
    return this.getValue('website')
  }

  get address() {
    return this.getValue('address')
  }

  get sizeClassification() {
    return this.getValue('sizeClassification')
  }

  get googleMapsData() {
    return this.getValue('googleMapsData')
  }

  get cnpjWsData() {
    return this.getValue('cnpjWsData')
  }

  get decisionMakers() {
    return this.getValue('decisionMakers')
  }

  get enrichmentStatus() {
    return this.getValue('enrichmentStatus')
  }

  get score() {
    return this.getValue('score')
  }

  get temperature() {
    return this.getValue('temperature')
  }

  get stage() {
    return this.getValue('stage')
  }

  get source() {
    return this.getValue('source')
  }
}
