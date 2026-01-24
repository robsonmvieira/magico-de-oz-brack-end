import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const PartnerSchema = pgTable('partners', {
  ...Model,
  basic_cnpj: text('basic_cnpj').notNull(),
  partner_identifier: text('partner_identifier'),
  partner_name: text('partner_name'),
  partner_doc: text('partner_doc'),
  partner_qualification: text('partner_qualification'),
  entry_date: timestamp('entry_date'),
  country_code: text('country_code'),
  legal_representative_doc: text('legal_representative_doc'),
  legal_representative_name: text('legal_representative_name'),
  legal_representative_qualification: text(
    'legal_representative_qualification'
  ),
  age_range: text('age_range')
})

export type PartnerModel = typeof PartnerSchema.$inferSelect
export type NewPartnerModel = typeof PartnerSchema.$inferInsert
