import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const CountrySchema = pgTable('countries', {
  ...Model,
  code: text('code').notNull(),
  name: text('name').notNull()
})

export type CountryModel = typeof CountrySchema.$inferSelect
export type NewCountryModel = typeof CountrySchema.$inferInsert
