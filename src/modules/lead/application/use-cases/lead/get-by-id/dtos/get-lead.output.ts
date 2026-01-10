import {
  AddressJson,
  GoogleMapsDataJson,
  CnpjDataJson,
  DecisionMakerJson,
  EnrichmentStatusJson,
  LeadScoreJson,
  ClassificationJson
} from '@modules/lead/domain/models'

export class GetLeadOutput {
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
