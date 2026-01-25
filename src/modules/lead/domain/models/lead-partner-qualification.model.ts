import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const LeadPartnerQualificationSchema = pgTable(
  'lead_partner_qualifications',
  {
    ...Model,
    code: text('code').notNull(),
    description: text('description').notNull()
  }
)

export type LeadPartnerQualificationModel =
  typeof LeadPartnerQualificationSchema.$inferSelect
export type NewLeadPartnerQualificationModel =
  typeof LeadPartnerQualificationSchema.$inferInsert
