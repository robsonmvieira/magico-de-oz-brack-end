import { LeadModel, NewLeadModel } from '@modules/lead/domain/models'
import { SimpleModel } from '@modules/lead/domain/models/simple.model'
import { PartnerModel } from '@modules/lead/domain/models/partner.model'
import { CountryModel } from '@modules/lead/domain/models/country.model'
import { LegalNatureModel } from '@modules/lead/domain/models/legal-nature.model'
import { CnaeModel } from '@modules/lead/domain/models/cnae.model'
import { CompanyModel } from '@modules/lead/domain/models/company.model'
import { EstablishmentModel } from '@modules/lead/domain/models/establishment.model'
import { LeadSituationChangeReasonModel } from '@modules/lead/domain/models/lead-situation-change-reason.model'
import { MunicipalityModel } from '@modules/lead/domain/models/municipality.model'
import { LeadPartnerQualificationModel } from '@modules/lead/domain/models/lead-partner-qualification.model'
import {
  CnpjRawData,
  CnpjRawPartner,
  ILeadRepository
} from '@modules/lead/domain/repositories'
import { LeadStage, LeadTemperature } from '@modules/lead/domain/enums'
import { randomUUID } from 'crypto'

export class LeadInMemoryRepository implements ILeadRepository {
  private items: LeadModel[] = []
  private readonly simpleItems: SimpleModel[] = []
  private readonly partnerItems: PartnerModel[] = []
  private readonly countryItems: CountryModel[] = []
  private readonly legalNatureItems: LegalNatureModel[] = []
  private readonly cnaeItems: CnaeModel[] = []
  private readonly companyItems: CompanyModel[] = []
  private readonly establishmentItems: EstablishmentModel[] = []
  private readonly leadSituationChangeReasonItems: LeadSituationChangeReasonModel[] =
    []
  private readonly municipalityItems: MunicipalityModel[] = []
  private readonly leadPartnerQualificationItems: LeadPartnerQualificationModel[] =
    []

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

  async findByCnpjRaw(cnpj: string): Promise<CnpjRawData | null> {
    const normalizedCnpj = cnpj.replace(/\D/g, '')

    const establishment = this.establishmentItems.find(
      est => est.basic_cnpj === normalizedCnpj
    )

    const company = this.companyItems.find(
      comp => comp.basic_cnpj === normalizedCnpj
    )

    if (!company || !establishment) {
      return null
    }

    const partners = this.partnerItems.filter(
      partner => partner.basic_cnpj === normalizedCnpj
    )

    // Buscar nome do município
    const municipality = this.municipalityItems.find(
      m => m.code === establishment.city_code
    )

    // Buscar nome do país
    const country = this.countryItems.find(
      c => c.code === establishment.country_code
    )

    // Montar telefone completo
    const phone =
      establishment.ddd1 && establishment.phone1
        ? `${establishment.ddd1}${establishment.phone1}`
        : null

    // Montar rua completa
    const street =
      establishment.street_type && establishment.street
        ? `${establishment.street_type} ${establishment.street}`
        : (establishment.street ?? null)

    const partnersData: CnpjRawPartner[] = partners.map(p => ({
      name: p.partner_name ?? null,
      doc: p.partner_doc ?? null,
      qualification: p.partner_qualification ?? null
    }))

    return {
      basicCnpj: establishment.basic_cnpj,
      cnpjOrder: establishment.cnpj_order,
      cnpjDv: establishment.cnpj_dv,
      companyName: company.company_name,
      legalNatureCode: company.legal_nature_code,
      socialCapital: company.social_capital,
      companySize: company.company_size,
      tradeName: establishment.trade_name ?? null,
      registrationStatus: establishment.registration_status,
      activityStartDate: establishment.activity_start_date ?? null,
      mainCnae: establishment.main_cnae,
      phone,
      email: establishment.email ?? null,
      street,
      number: establishment.number ?? null,
      complement: establishment.complement ?? null,
      neighborhood: establishment.neighborhood ?? null,
      zipCode: establishment.zip_code ?? null,
      state: establishment.state ?? null,
      cityCode: establishment.city_code ?? null,
      cityName: municipality?.name ?? null,
      countryCode: establishment.country_code ?? null,
      countryName: country?.name ?? null,
      partners: partnersData
    }
  }

  async findByCompanyNameRaw(
    companyName: string,
    limit: number = 50
  ): Promise<CnpjRawData[]> {
    const searchTerm = companyName.toLowerCase()

    // Buscar empresas pelo nome (case-insensitive, busca parcial)
    const matchingCompanies = this.companyItems.filter(company =>
      company.company_name.toLowerCase().includes(searchTerm)
    )

    if (matchingCompanies.length === 0) {
      return []
    }

    // Para cada empresa encontrada, buscar dados completos
    const results: CnpjRawData[] = []

    for (const company of matchingCompanies.slice(0, limit)) {
      const fullData = await this.findByCnpjRaw(company.basic_cnpj)
      if (fullData) {
        results.push(fullData)
      }
    }

    return results
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

  // CNAE module methods
  async findCnaeByCode(code: string): Promise<CnaeModel | null> {
    return this.cnaeItems.find(item => item.code === code) ?? null
  }

  async findAllCnaes(): Promise<CnaeModel[]> {
    return this.cnaeItems.filter(item => !item.isDeleted)
  }

  async createCnae(cnae: CnaeModel): Promise<CnaeModel> {
    this.cnaeItems.push(cnae)
    return cnae
  }

  async bulkCnaeInsert(cnaes: CnaeModel[]): Promise<number> {
    this.cnaeItems.push(...cnaes)
    return cnaes.length
  }

  clearCnaes(): void {
    this.cnaeItems.length = 0
  }

  getCnaeItems(): CnaeModel[] {
    return [...this.cnaeItems]
  }

  // Company module methods
  async findCompanyByBasicCnpj(
    basicCnpj: string
  ): Promise<CompanyModel | null> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    return (
      this.companyItems.find(item => item.basic_cnpj === normalizedCnpj) ?? null
    )
  }

  async findAllCompanies(): Promise<CompanyModel[]> {
    return this.companyItems.filter(item => !item.isDeleted)
  }

  async createCompany(company: CompanyModel): Promise<CompanyModel> {
    this.companyItems.push(company)
    return company
  }

  async bulkCompanyInsert(companies: CompanyModel[]): Promise<number> {
    this.companyItems.push(...companies)
    return companies.length
  }

  clearCompanies(): void {
    this.companyItems.length = 0
  }

  getCompanyItems(): CompanyModel[] {
    return [...this.companyItems]
  }

  // Establishment module methods
  async findEstablishmentByFullCnpj(
    basicCnpj: string,
    cnpjOrder: string,
    cnpjDv: string
  ): Promise<EstablishmentModel | null> {
    const normalizedBasicCnpj = basicCnpj.replaceAll(/\D/g, '')
    const normalizedCnpjOrder = cnpjOrder.replaceAll(/\D/g, '')
    const normalizedCnpjDv = cnpjDv.replaceAll(/\D/g, '')
    return (
      this.establishmentItems.find(
        item =>
          item.basic_cnpj === normalizedBasicCnpj &&
          item.cnpj_order === normalizedCnpjOrder &&
          item.cnpj_dv === normalizedCnpjDv
      ) ?? null
    )
  }

  async findEstablishmentsByBasicCnpj(
    basicCnpj: string
  ): Promise<EstablishmentModel[]> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    return this.establishmentItems.filter(
      item => item.basic_cnpj === normalizedCnpj
    )
  }

  async findAllEstablishments(): Promise<EstablishmentModel[]> {
    return this.establishmentItems.filter(item => !item.isDeleted)
  }

  async createEstablishment(
    establishment: EstablishmentModel
  ): Promise<EstablishmentModel> {
    this.establishmentItems.push(establishment)
    return establishment
  }

  async bulkEstablishmentInsert(
    establishments: EstablishmentModel[]
  ): Promise<number> {
    this.establishmentItems.push(...establishments)
    return establishments.length
  }

  clearEstablishments(): void {
    this.establishmentItems.length = 0
  }

  getEstablishmentItems(): EstablishmentModel[] {
    return [...this.establishmentItems]
  }

  // Lead Situation Change Reason module methods
  async findLeadSituationChangeReasonByCode(
    code: string
  ): Promise<LeadSituationChangeReasonModel | null> {
    return (
      this.leadSituationChangeReasonItems.find(item => item.code === code) ??
      null
    )
  }

  async findAllLeadSituationChangeReasons(): Promise<
    LeadSituationChangeReasonModel[]
  > {
    return this.leadSituationChangeReasonItems.filter(item => !item.isDeleted)
  }

  async createLeadSituationChangeReason(
    reason: LeadSituationChangeReasonModel
  ): Promise<LeadSituationChangeReasonModel> {
    this.leadSituationChangeReasonItems.push(reason)
    return reason
  }

  async bulkLeadSituationChangeReasonInsert(
    reasons: LeadSituationChangeReasonModel[]
  ): Promise<number> {
    this.leadSituationChangeReasonItems.push(...reasons)
    return reasons.length
  }

  clearLeadSituationChangeReasons(): void {
    this.leadSituationChangeReasonItems.length = 0
  }

  getLeadSituationChangeReasonItems(): LeadSituationChangeReasonModel[] {
    return [...this.leadSituationChangeReasonItems]
  }

  // Municipality module methods
  async findMunicipalityByCode(
    code: string
  ): Promise<MunicipalityModel | null> {
    return this.municipalityItems.find(item => item.code === code) ?? null
  }

  async findAllMunicipalities(): Promise<MunicipalityModel[]> {
    return this.municipalityItems.filter(item => !item.isDeleted)
  }

  async createMunicipality(
    municipality: MunicipalityModel
  ): Promise<MunicipalityModel> {
    this.municipalityItems.push(municipality)
    return municipality
  }

  async bulkMunicipalityInsert(
    municipalities: MunicipalityModel[]
  ): Promise<number> {
    this.municipalityItems.push(...municipalities)
    return municipalities.length
  }

  clearMunicipalities(): void {
    this.municipalityItems.length = 0
  }

  getMunicipalityItems(): MunicipalityModel[] {
    return [...this.municipalityItems]
  }

  // Lead Partner Qualification module methods
  async findLeadPartnerQualificationByCode(
    code: string
  ): Promise<LeadPartnerQualificationModel | null> {
    return (
      this.leadPartnerQualificationItems.find(item => item.code === code) ??
      null
    )
  }

  async findAllLeadPartnerQualifications(): Promise<
    LeadPartnerQualificationModel[]
  > {
    return this.leadPartnerQualificationItems.filter(item => !item.isDeleted)
  }

  async createLeadPartnerQualification(
    qualification: LeadPartnerQualificationModel
  ): Promise<LeadPartnerQualificationModel> {
    this.leadPartnerQualificationItems.push(qualification)
    return qualification
  }

  async bulkLeadPartnerQualificationInsert(
    qualifications: LeadPartnerQualificationModel[]
  ): Promise<number> {
    this.leadPartnerQualificationItems.push(...qualifications)
    return qualifications.length
  }

  clearLeadPartnerQualifications(): void {
    this.leadPartnerQualificationItems.length = 0
  }

  getLeadPartnerQualificationItems(): LeadPartnerQualificationModel[] {
    return [...this.leadPartnerQualificationItems]
  }
}
