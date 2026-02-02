import { CnpjRawData } from '@modules/lead/domain/repositories'
import { BusinessSector } from '@modules/lead/domain/enums'
import { getSectorFromCnae } from '@modules/lead/domain/mappings'

export enum SearchResultSource {
  LEAD = 'lead',
  RECEITA_FEDERAL = 'receita_federal'
}

export interface SearchLeadResultPartner {
  name: string | null
  doc: string | null
  qualification: string | null
}

export interface SearchLeadResult {
  // Fonte do dado
  source: SearchResultSource

  // Se já existe como lead no CRM
  existsAsLead: boolean
  leadId?: string

  // Identificação CNPJ
  basicCnpj: string
  fullCnpj: string
  cnpjOrder: string
  cnpjDv: string

  // Dados da Empresa
  companyName: string
  tradeName: string | null
  legalNatureCode: string
  socialCapital: string
  companySize: string

  // Dados do Estabelecimento
  registrationStatus: string
  activityStartDate: string | null
  mainCnae: string
  sector: BusinessSector

  // Contato
  phone: string | null
  email: string | null

  // Endereço
  address: {
    street: string | null
    number: string | null
    complement: string | null
    neighborhood: string | null
    zipCode: string | null
    city: string | null
    state: string | null
    country: string | null
  }

  // Sócios
  partners: SearchLeadResultPartner[]
}

export class SearchLeadsByCriteriaOutput {
  results: SearchLeadResult[]
  total: number
  hasMore: boolean

  constructor(data: {
    results: SearchLeadResult[]
    total: number
    hasMore: boolean
  }) {
    this.results = data.results
    this.total = data.total
    this.hasMore = data.hasMore
  }

  static fromCnpjRawData(
    rawData: CnpjRawData,
    existsAsLead: boolean,
    leadId?: string
  ): SearchLeadResult {
    return {
      source: SearchResultSource.RECEITA_FEDERAL,
      existsAsLead,
      leadId,
      basicCnpj: rawData.basicCnpj,
      fullCnpj: `${rawData.basicCnpj}${rawData.cnpjOrder}${rawData.cnpjDv}`,
      cnpjOrder: rawData.cnpjOrder,
      cnpjDv: rawData.cnpjDv,
      companyName: rawData.companyName,
      tradeName: rawData.tradeName,
      legalNatureCode: rawData.legalNatureCode,
      socialCapital: rawData.socialCapital,
      companySize: rawData.companySize,
      registrationStatus: rawData.registrationStatus,
      activityStartDate: rawData.activityStartDate,
      mainCnae: rawData.mainCnae,
      sector: getSectorFromCnae(rawData.mainCnae),
      phone: rawData.phone,
      email: rawData.email,
      address: {
        street: rawData.street,
        number: rawData.number,
        complement: rawData.complement,
        neighborhood: rawData.neighborhood,
        zipCode: rawData.zipCode,
        city: rawData.cityName,
        state: rawData.state,
        country: rawData.countryName
      },
      partners: rawData.partners.map(p => ({
        name: p.name,
        doc: p.doc,
        qualification: p.qualification
      }))
    }
  }
}
