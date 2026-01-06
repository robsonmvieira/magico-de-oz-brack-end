import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text, integer } from 'drizzle-orm/pg-core'

export const LeadCategorySchema = pgTable('lead_categories', {
  ...Model,
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  priority: integer('priority').notNull(),
  score_bonus: integer('score_bonus').notNull(),
  keywords: text('keywords').notNull(),
  color: text('color').notNull()
})

export type LeadCategoryModel = typeof LeadCategorySchema.$inferSelect
export type NewLeadCategoryModel = typeof LeadCategorySchema.$inferInsert
