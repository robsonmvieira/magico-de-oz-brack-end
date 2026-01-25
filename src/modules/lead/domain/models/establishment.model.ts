import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const EstablishmentSchema = pgTable('establishments', {
  ...Model,
  basic_cnpj: text('basic_cnpj').notNull(),
  cnpj_order: text('cnpj_order').notNull(),
  cnpj_dv: text('cnpj_dv').notNull(),
  branch_type: text('branch_type').notNull(),
  trade_name: text('trade_name'),
  registration_status: text('registration_status').notNull(),
  registration_status_date: text('registration_status_date'),
  registration_status_reason: text('registration_status_reason'),
  foreign_city_name: text('foreign_city_name'),
  country_code: text('country_code'),
  activity_start_date: text('activity_start_date'),
  main_cnae: text('main_cnae').notNull(),
  secondary_cnaes: text('secondary_cnaes'),
  street_type: text('street_type'),
  street: text('street'),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood'),
  zip_code: text('zip_code'),
  state: text('state'),
  city_code: text('city_code'),
  ddd1: text('ddd1'),
  phone1: text('phone1'),
  ddd2: text('ddd2'),
  phone2: text('phone2'),
  fax_ddd: text('fax_ddd'),
  fax: text('fax'),
  email: text('email'),
  special_situation: text('special_situation'),
  special_situation_date: text('special_situation_date')
})

export type EstablishmentModel = typeof EstablishmentSchema.$inferSelect
export type NewEstablishmentModel = typeof EstablishmentSchema.$inferInsert
