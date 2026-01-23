import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const SimpleSchema = pgTable('simples', {
  ...Model,
  basic_doc: text('basic_doc').notNull(),
  choose_simple_module: text('choose_simple_module'),
  date_simple_module_start: timestamp('date_simple_module_start'),
  date_exclude_simple_module_start: timestamp(
    'date_exclude_simple_module_start'
  ),
  choose_mei: text('choose_mei'),
  date_mei_start: timestamp('date_mei_start'),
  date_exclude_mei_start: timestamp('date_exclude_mei_start')
})

export type SimpleModel = typeof SimpleSchema.$inferSelect
export type NewSimpleModel = typeof SimpleSchema.$inferInsert
