import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const MunicipalitySchema = pgTable('municipalities', {
  ...Model,
  code: text('code').notNull(),
  name: text('name').notNull()
})

export type MunicipalityModel = typeof MunicipalitySchema.$inferSelect
export type NewMunicipalityModel = typeof MunicipalitySchema.$inferInsert
