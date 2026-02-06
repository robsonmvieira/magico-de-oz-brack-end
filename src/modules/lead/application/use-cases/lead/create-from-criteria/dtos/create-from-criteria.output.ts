import { LeadOutput } from '../../list/dtos'

export interface CreatedLeadInfo {
  lead: LeadOutput
  source: 'google_places' | 'receita_federal_only'
  categoryId: string
  categoryName: string
}

export class CreateFromCriteriaOutput {
  created: CreatedLeadInfo[]
  errors: Array<{
    cnpj: string
    companyName: string
    message: string
  }>
  statistics: {
    total: number
    createdFromGoogle: number
    createdFromRFOnly: number
    failed: number
  }

  constructor(data: {
    created: CreatedLeadInfo[]
    errors: Array<{ cnpj: string; companyName: string; message: string }>
  }) {
    this.created = data.created
    this.errors = data.errors
    this.statistics = {
      total: data.created.length + data.errors.length,
      createdFromGoogle: data.created.filter(c => c.source === 'google_places')
        .length,
      createdFromRFOnly: data.created.filter(
        c => c.source === 'receita_federal_only'
      ).length,
      failed: data.errors.length
    }
  }
}
