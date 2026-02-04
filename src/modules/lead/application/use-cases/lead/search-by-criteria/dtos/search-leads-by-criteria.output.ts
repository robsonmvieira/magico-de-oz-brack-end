import { BusinessSector } from '@modules/lead/domain/enums'

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
}
