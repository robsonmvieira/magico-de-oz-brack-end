import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const CnaeSchema = pgTable('cnaes', {
  ...Model,
  code: text('code').notNull(),
  description: text('description').notNull()
})

export type CnaeModel = typeof CnaeSchema.$inferSelect
export type NewCnaeModel = typeof CnaeSchema.$inferInsert
