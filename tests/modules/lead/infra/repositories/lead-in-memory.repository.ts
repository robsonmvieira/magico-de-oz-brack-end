import { LeadModel, NewLeadModel } from '@modules/lead/domain/models'
import { SimpleModel } from '@modules/lead/domain/models/simple.model'
import { PartnerModel } from '@modules/lead/domain/models/partner.model'
import { CountryModel } from '@modules/lead/domain/models/country.model'
import { LegalNatureModel } from '@modules/lead/domain/models/legal-nature.model'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadStage, LeadTemperature } from '@modules/lead/domain/enums'
import { randomUUID } from 'crypto'

export class LeadInMemoryRepository implements ILeadRepository {
  private items: LeadModel[] = []
  private readonly simpleItems: SimpleModel[] = []
  private readonly partnerItems: PartnerModel[] = []
  private readonly countryItems: CountryModel[] = []
  private readonly legalNatureItems: LegalNatureModel[] = []

  async save(entity: NewLeadModel): Promise<void> {
    const now = new Date()
    const item: LeadModel = {
      id: entity.id ?? randomUUID(),
      leadCategoryId: entity.leadCategoryId,
      companyName: entity.companyName,
      tradeName: entity.tradeName ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      website: entity.website ?? null,
      address: entity.address ?? null,
      sizeClassification: entity.sizeClassification ?? null,
      googleMapsData: entity.googleMapsData ?? null,
      cnpjWsData: entity.cnpjWsData ?? null,
      decisionMakers: entity.decisionMakers ?? [],
      enrichmentStatus: entity.enrichmentStatus,
      score: entity.score,
      temperature: entity.temperature ?? 'cold',
      stage: entity.stage ?? 'new',
      source: entity.source,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      isActive: true,
      isBlocked: false
    }
    this.items.push(item)
  }

  async update(modelId: string, entity: Partial<NewLeadModel>): Promise<void> {
    const index = this.items.findIndex(item => item.id === modelId)
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        ...entity,
        updatedAt: new Date()
      }
    }
  }

  async delete(entity: LeadModel): Promise<void> {
    const index = this.items.findIndex(item => item.id === entity.id)
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        isDeleted: true,
        updatedAt: new Date()
      }
    }
  }

  async findById(id: string): Promise<LeadModel | null> {
    return this.items.find(item => item.id === id) ?? null
  }

  async findAll(): Promise<LeadModel[]> {
    return this.items.filter(item => !item.isDeleted)
  }

  async findByCompanyName(companyName: string): Promise<LeadModel | null> {
    return (
      this.items.find(
        item => !item.isDeleted && item.companyName === companyName
      ) ?? null
    )
  }

  async findByEmail(email: string): Promise<LeadModel | null> {
    return (
      this.items.find(item => !item.isDeleted && item.email === email) ?? null
    )
  }

  async findByPhone(phone: string): Promise<LeadModel | null> {
    return (
      this.items.find(item => !item.isDeleted && item.phone === phone) ?? null
    )
  }

  async findByCategoryId(categoryId: string): Promise<LeadModel[]> {
    return this.items.filter(
      item => !item.isDeleted && item.leadCategoryId === categoryId
    )
  }

  async findByStage(stage: LeadStage): Promise<LeadModel[]> {
    return this.items.filter(item => !item.isDeleted && item.stage === stage)
  }

  async findByTemperature(temperature: LeadTemperature): Promise<LeadModel[]> {
    return this.items.filter(
      item => !item.isDeleted && item.temperature === temperature
    )
  }

  async findActive(): Promise<LeadModel[]> {
    return this.items.filter(item => !item.isDeleted && item.isActive)
  }

  async findByGooglePlaceId(placeId: string): Promise<LeadModel | null> {
    return (
      this.items.find(
        item => !item.isDeleted && item.googleMapsData?.placeId === placeId
      ) ?? null
    )
  }

  async findByCnpj(cnpj: string): Promise<LeadModel | null> {
    const normalizedCnpj = cnpj.replace(/\D/g, '')
    return (
      this.items.find(
        item =>
          !item.isDeleted &&
          item.cnpjWsData?.cnpj?.replace(/\D/g, '') === normalizedCnpj
      ) ?? null
    )
  }

  async exists(id: string): Promise<boolean> {
    return this.items.some(item => item.id === id)
  }

  async existsByCompanyName(companyName: string): Promise<boolean> {
    return this.items.some(
      item => !item.isDeleted && item.companyName === companyName
    )
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.items.some(item => !item.isDeleted && item.email === email)
  }

  // Simple module methods
  async findByMEI(mei: string): Promise<SimpleModel | null> {
    return this.simpleItems.find(item => item.choose_mei === mei) ?? null
  }

  async findSimpleByBasicDoc(basicDoc: string): Promise<SimpleModel | null> {
    const normalizedDoc = basicDoc.replaceAll(/\D/g, '')
    return (
      this.simpleItems.find(item => item.basic_doc === normalizedDoc) ?? null
    )
  }

  async createSimple(simple: SimpleModel): Promise<SimpleModel> {
    this.simpleItems.push(simple)
    return simple
  }

  async bulkSimple(simples: SimpleModel[]): Promise<SimpleModel[]> {
    this.simpleItems.push(...simples)
    return simples
  }

  async bulkSimpleInsert(simples: SimpleModel[]): Promise<number> {
    this.simpleItems.push(...simples)
    return simples.length
  }

  async copySimpleFromStream(stream: NodeJS.ReadableStream): Promise<number> {
    // Mock implementation - just count lines
    let count = 0
    for await (const chunk of stream) {
      const lines = chunk
        .toString()
        .split('\n')
        .filter((l: string) => l.trim())
      count += lines.length
    }
    return count
  }

  // Partner module methods
  async findPartnersByBasicCnpj(basicCnpj: string): Promise<PartnerModel[]> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    return this.partnerItems.filter(item => item.basic_cnpj === normalizedCnpj)
  }

  async findPartnerByDoc(doc: string): Promise<PartnerModel | null> {
    const normalizedDoc = doc.replaceAll(/\D/g, '')
    return (
      this.partnerItems.find(item => item.partner_doc === normalizedDoc) ?? null
    )
  }

  async createPartner(partner: PartnerModel): Promise<PartnerModel> {
    this.partnerItems.push(partner)
    return partner
  }

  async bulkPartnerInsert(partners: PartnerModel[]): Promise<number> {
    this.partnerItems.push(...partners)
    return partners.length
  }

  // Country module methods
  async findCountryByCode(code: string): Promise<CountryModel | null> {
    return this.countryItems.find(item => item.code === code) ?? null
  }

  async findAllCountries(): Promise<CountryModel[]> {
    return this.countryItems.filter(item => !item.isDeleted)
  }

  async createCountry(country: CountryModel): Promise<CountryModel> {
    this.countryItems.push(country)
    return country
  }

  async bulkCountryInsert(countries: CountryModel[]): Promise<number> {
    this.countryItems.push(...countries)
    return countries.length
  }

  // Legal Nature module methods
  async findLegalNatureByCode(code: string): Promise<LegalNatureModel | null> {
    return this.legalNatureItems.find(item => item.code === code) ?? null
  }

  async findAllLegalNatures(): Promise<LegalNatureModel[]> {
    return this.legalNatureItems.filter(item => !item.isDeleted)
  }

  async createLegalNature(
    legalNature: LegalNatureModel
  ): Promise<LegalNatureModel> {
    this.legalNatureItems.push(legalNature)
    return legalNature
  }

  async bulkLegalNatureInsert(
    legalNatures: LegalNatureModel[]
  ): Promise<number> {
    this.legalNatureItems.push(...legalNatures)
    return legalNatures.length
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.items = []
  }

  clearSimple(): void {
    this.simpleItems.length = 0
  }

  getItems(): LeadModel[] {
    return [...this.items]
  }

  getSimpleItems(): SimpleModel[] {
    return [...this.simpleItems]
  }

  clearPartners(): void {
    this.partnerItems.length = 0
  }

  getPartnerItems(): PartnerModel[] {
    return [...this.partnerItems]
  }

  clearCountries(): void {
    this.countryItems.length = 0
  }

  getCountryItems(): CountryModel[] {
    return [...this.countryItems]
  }

  clearLegalNatures(): void {
    this.legalNatureItems.length = 0
  }

  getLegalNatureItems(): LegalNatureModel[] {
    return [...this.legalNatureItems]
  }
}
