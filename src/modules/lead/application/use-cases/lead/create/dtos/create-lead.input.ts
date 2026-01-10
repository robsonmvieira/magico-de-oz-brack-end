import { LeadSource } from '@modules/lead/domain/enums'
import { AddressDto } from '@modules/lead/application/dtos'

export interface CreateLeadInput {
  leadCategoryId: string
  companyName: string
  source: LeadSource
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressDto
}
