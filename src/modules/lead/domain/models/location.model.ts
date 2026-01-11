import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text, integer } from 'drizzle-orm/pg-core'

export const LocationSchema = pgTable('locations', {
  ...Model,
  name: text('name').notNull(),
  canonicalName: text('canonical_name').notNull(),
  googleId: integer('google_id').notNull().unique(),
  countryCode: text('country_code').notNull(),
  targetType: text('target_type').notNull()
})

export type LocationModel = typeof LocationSchema.$inferSelect
export type NewLocationModel = typeof LocationSchema.$inferInsert
