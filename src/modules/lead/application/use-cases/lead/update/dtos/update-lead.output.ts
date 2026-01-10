import {
  AddressJson,
  ClassificationJson,
  GoogleMapsDataJson,
  CnpjDataJson,
  DecisionMakerJson,
  EnrichmentStatusJson,
  LeadScoreJson
} from '@modules/lead/domain/models'

export interface UpdateLeadOutput {
  id: string
  leadCategoryId: string
  companyName: string
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressJson
  sizeClassification?: ClassificationJson
  googleMapsData?: GoogleMapsDataJson
  cnpjWsData?: CnpjDataJson
  decisionMakers: DecisionMakerJson[]
  enrichmentStatus: EnrichmentStatusJson
  score: LeadScoreJson
  temperature: string
  stage: string
  source: string
  createdAt: Date
  updatedAt?: Date
}
