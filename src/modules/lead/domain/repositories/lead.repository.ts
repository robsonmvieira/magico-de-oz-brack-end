import { IRepository } from '@modules/core/domain/repositories'
import { LeadModel, NewLeadModel } from '../models'
import { BusinessSector, LeadStage, LeadTemperature } from '../enums'
import { SimpleModel } from '../models/simple.model'
import { PartnerModel } from '../models/partner.model'
import { CountryModel } from '../models/country.model'
import { LegalNatureModel } from '../models/legal-nature.model'
import { CnaeModel } from '../models/cnae.model'
import { CompanyModel } from '../models/company.model'
import { EstablishmentModel } from '../models/establishment.model'
import { LeadSituationChangeReasonModel } from '../models/lead-situation-change-reason.model'
import { MunicipalityModel } from '../models/municipality.model'
import { LeadPartnerQualificationModel } from '../models/lead-partner-qualification.model'

export interface CnpjRawPartner {
  name: string | null
  doc: string | null
  qualification: string | null
}

export interface SearchByCriteriaFilter {
  sector?: BusinessSector
  region?: string // sudeste, sul, nordeste, norte, centro-oeste
  states?: string[] // UFs: SP, RJ, MG, etc.
  companySize?: string // 00, 01, 03, 05 (códigos da Receita)
  // Advanced filters
  foundationYear?: string // Ano de fundação (YYYY)
  keywords?: string[] // Palavras-chave para busca em trade_name, company_name, cnae
  term?: string // Termo de busca livre (trade_name ou company_name)
  limit?: number
}

export interface CnpjRawData {
  // Identificação CNPJ
  basicCnpj: string
  cnpjOrder: string
  cnpjDv: string

  // Dados da Empresa (companies)
  companyName: string
  legalNatureCode: string
  socialCapital: string
  companySize: string

  // Dados do Estabelecimento (establishments)
  tradeName: string | null
  registrationStatus: string
  activityStartDate: string | null
  mainCnae: string

  // Contato
  phone: string | null
  email: string | null

  // Endereço
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  zipCode: string | null
  state: string | null
  cityCode: string | null
  cityName: string | null
  countryCode: string | null
  countryName: string | null

  // Sócios
  partners: CnpjRawPartner[]
}

export interface ILeadRepository extends IRepository<LeadModel, NewLeadModel> {
  // Busca por campos únicos
  findByCompanyName(companyName: string): Promise<LeadModel | null>
  findByEmail(email: string): Promise<LeadModel | null>
  findByPhone(phone: string): Promise<LeadModel | null>

  // Busca por categoria
  findByCategoryId(categoryId: string): Promise<LeadModel[]>

  // Busca por status
  findByStage(stage: LeadStage): Promise<LeadModel[]>
  findByTemperature(temperature: LeadTemperature): Promise<LeadModel[]>

  // Busca de leads ativos
  findActive(): Promise<LeadModel[]>

  // Busca por Google Place ID (evitar duplicados do Google Maps)
  findByGooglePlaceId(placeId: string): Promise<LeadModel | null>

  // Busca por CNPJ
  findByCnpj(cnpj: string): Promise<LeadModel | null>
  findByCnpjRaw(cnpj: string): Promise<CnpjRawData | null>

  // Busca por nome da empresa nas tabelas raw da Receita
  findByCompanyNameRaw(
    companyName: string,
    limit?: number
  ): Promise<CnpjRawData[]>

  // Busca por critérios (setor, região, porte)
  findByCriteriaRaw(filter: SearchByCriteriaFilter): Promise<CnpjRawData[]>

  // Verificações de existência
  exists(id: string): Promise<boolean>
  existsByCompanyName(companyName: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>

  // simple module
  findByMEI(mei: string): Promise<SimpleModel | null>
  findSimpleByBasicDoc(basicDoc: string): Promise<SimpleModel | null>
  createSimple(simple: SimpleModel): Promise<SimpleModel>
  bulkSimple(simples: SimpleModel[]): Promise<SimpleModel[]>
  bulkSimpleInsert(simples: SimpleModel[]): Promise<number>
  copySimpleFromStream(stream: NodeJS.ReadableStream): Promise<number>

  // partner module
  findPartnersByBasicCnpj(basicCnpj: string): Promise<PartnerModel[]>
  findPartnerByDoc(doc: string): Promise<PartnerModel | null>
  createPartner(partner: PartnerModel): Promise<PartnerModel>
  bulkPartnerInsert(partners: PartnerModel[]): Promise<number>

  // country module
  findCountryByCode(code: string): Promise<CountryModel | null>
  findAllCountries(): Promise<CountryModel[]>
  createCountry(country: CountryModel): Promise<CountryModel>
  bulkCountryInsert(countries: CountryModel[]): Promise<number>

  // legal nature module
  findLegalNatureByCode(code: string): Promise<LegalNatureModel | null>
  findAllLegalNatures(): Promise<LegalNatureModel[]>
  createLegalNature(legalNature: LegalNatureModel): Promise<LegalNatureModel>
  bulkLegalNatureInsert(legalNatures: LegalNatureModel[]): Promise<number>

  // cnae module
  findCnaeByCode(code: string): Promise<CnaeModel | null>
  findAllCnaes(): Promise<CnaeModel[]>
  createCnae(cnae: CnaeModel): Promise<CnaeModel>
  bulkCnaeInsert(cnaes: CnaeModel[]): Promise<number>

  // company module
  findCompanyByBasicCnpj(basicCnpj: string): Promise<CompanyModel | null>
  findAllCompanies(): Promise<CompanyModel[]>
  createCompany(company: CompanyModel): Promise<CompanyModel>
  bulkCompanyInsert(companies: CompanyModel[]): Promise<number>

  // establishment module
  findEstablishmentByFullCnpj(
    basicCnpj: string,
    cnpjOrder: string,
    cnpjDv: string
  ): Promise<EstablishmentModel | null>
  findEstablishmentsByBasicCnpj(
    basicCnpj: string
  ): Promise<EstablishmentModel[]>
  findAllEstablishments(): Promise<EstablishmentModel[]>
  createEstablishment(
    establishment: EstablishmentModel
  ): Promise<EstablishmentModel>
  bulkEstablishmentInsert(establishments: EstablishmentModel[]): Promise<number>

  // lead situation change reason module
  findLeadSituationChangeReasonByCode(
    code: string
  ): Promise<LeadSituationChangeReasonModel | null>
  findAllLeadSituationChangeReasons(): Promise<LeadSituationChangeReasonModel[]>
  createLeadSituationChangeReason(
    reason: LeadSituationChangeReasonModel
  ): Promise<LeadSituationChangeReasonModel>
  bulkLeadSituationChangeReasonInsert(
    reasons: LeadSituationChangeReasonModel[]
  ): Promise<number>

  // municipality module
  findMunicipalityByCode(code: string): Promise<MunicipalityModel | null>
  findAllMunicipalities(): Promise<MunicipalityModel[]>
  createMunicipality(
    municipality: MunicipalityModel
  ): Promise<MunicipalityModel>
  bulkMunicipalityInsert(municipalities: MunicipalityModel[]): Promise<number>

  // lead partner qualification module
  findLeadPartnerQualificationByCode(
    code: string
  ): Promise<LeadPartnerQualificationModel | null>
  findAllLeadPartnerQualifications(): Promise<LeadPartnerQualificationModel[]>
  createLeadPartnerQualification(
    qualification: LeadPartnerQualificationModel
  ): Promise<LeadPartnerQualificationModel>
  bulkLeadPartnerQualificationInsert(
    qualifications: LeadPartnerQualificationModel[]
  ): Promise<number>
}
