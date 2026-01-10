import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { LeadCategorySchema } from './lead-category.model'

// Enums para Postgres
export const leadSourceEnum = pgEnum('lead_source', [
  'google_maps',
  'apollo',
  'hunter',
  'linkedin',
  'imported',
  'manual',
  'referral'
])

export const leadTemperatureEnum = pgEnum('lead_temperature', [
  'hot',
  'warm',
  'cold',
  'discarded'
])

export const leadStageEnum = pgEnum('lead_stage', [
  'new',
  'contacted',
  'replied',
  'interested',
  'meeting_scheduled',
  'converted',
  'lost',
  'nurturing',
  'discarded',
  'ready'
])

export const companySizeEnum = pgEnum('company_size', [
  'micro',
  'small',
  'medium',
  'large'
])

// Tipos para campos JSONB
export type AddressJson = {
  street: string
  city: string
  state: string
  zipCode?: string
  neighborhood?: string
  latitude?: number
  longitude?: number
}

export type GoogleMapsDataJson = {
  placeId: string
  category: string
  rating?: number
  reviewsCount?: number
}

export type CnpjDataJson = {
  cnpj: string
  businessName: string
  openingDate?: string
  capital?: number
  businessNature?: string
  partners?: Array<{ name: string; qualification: string }>
}

export type DecisionMakerJson = {
  name: string
  role: string
  email?: string
  phone?: string
  linkedinUrl?: string
  source: 'apollo' | 'hunter' | 'linkedin' | 'manual'
  isPrimary?: boolean
}

export type EnrichmentStatusJson = {
  googleMaps: { enriched: boolean; at?: string }
  cnpjWs: { enriched: boolean; at?: string }
  apollo: { enriched: boolean; at?: string }
  hunter: { enriched: boolean; at?: string }
  linkedin: { enriched: boolean; at?: string }
}

export type LeadScoreJson = {
  completeness: number
  icpFit: number
  engagement: number
}

export type ClassificationJson = {
  value: string
  confidence: number
  method: 'keywords' | 'ai' | 'manual'
}

export const LeadSchema = pgTable('leads', {
  ...Model,

  // Foreign key para categoria
  leadCategoryId: uuid('lead_category_id')
    .notNull()
    .references(() => LeadCategorySchema.id),

  // Dados básicos
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),

  // Endereço (JSONB)
  address: jsonb('address').$type<AddressJson>(),

  // Classificação de tamanho (JSONB)
  sizeClassification: jsonb('size_classification').$type<ClassificationJson>(),

  // Dados de fontes externas (JSONB)
  googleMapsData: jsonb('google_maps_data').$type<GoogleMapsDataJson>(),
  cnpjWsData: jsonb('cnpj_ws_data').$type<CnpjDataJson>(),

  // Decision makers (array de JSONB)
  decisionMakers: jsonb('decision_makers')
    .$type<DecisionMakerJson[]>()
    .default([])
    .notNull(),

  // Status de enriquecimento (JSONB)
  enrichmentStatus: jsonb('enrichment_status')
    .$type<EnrichmentStatusJson>()
    .notNull(),

  // Score (JSONB)
  score: jsonb('score').$type<LeadScoreJson>().notNull(),

  // Enums
  temperature: leadTemperatureEnum('temperature').notNull().default('cold'),
  stage: leadStageEnum('stage').notNull().default('new'),
  source: leadSourceEnum('source').notNull()
})

export type LeadModel = typeof LeadSchema.$inferSelect
export type NewLeadModel = typeof LeadSchema.$inferInsert
