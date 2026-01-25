import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const LeadSituationChangeReasonSchema = pgTable(
  'lead_situation_change_reasons',
  {
    ...Model,
    code: text('code').notNull(),
    description: text('description').notNull()
  }
)

export type LeadSituationChangeReasonModel =
  typeof LeadSituationChangeReasonSchema.$inferSelect
export type NewLeadSituationChangeReasonModel =
  typeof LeadSituationChangeReasonSchema.$inferInsert
