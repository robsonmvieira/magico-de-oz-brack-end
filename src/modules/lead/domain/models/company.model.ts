import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const CompanySchema = pgTable('companies', {
  ...Model,
  basic_cnpj: text('basic_cnpj').notNull(),
  company_name: text('company_name').notNull(),
  legal_nature_code: text('legal_nature_code').notNull(),
  responsible_qualification: text('responsible_qualification').notNull(),
  social_capital: text('social_capital').notNull(),
  company_size: text('company_size').notNull(),
  federative_entity: text('federative_entity')
})

export type CompanyModel = typeof CompanySchema.$inferSelect
export type NewCompanyModel = typeof CompanySchema.$inferInsert
