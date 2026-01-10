import {
  AddressJson,
  DecisionMakerJson,
  EnrichmentStatusJson,
  LeadScoreJson
} from '@modules/lead/domain/models'

export class CreateLeadOutput {
  id: string
  leadCategoryId: string
  companyName: string
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressJson
  decisionMakers: DecisionMakerJson[]
  enrichmentStatus: EnrichmentStatusJson
  score: LeadScoreJson
  temperature: string
  stage: string
  source: string
  createdAt: Date
}
