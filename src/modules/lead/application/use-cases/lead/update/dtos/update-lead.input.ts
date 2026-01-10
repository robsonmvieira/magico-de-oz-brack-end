import { AddressProps } from '@modules/lead/domain/entities/contracts'

export interface UpdateLeadInput {
  leadCategoryId?: string
  companyName?: string
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressProps
}
