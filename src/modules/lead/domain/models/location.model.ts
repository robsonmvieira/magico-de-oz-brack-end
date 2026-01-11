import { pgTable, integer, serial, varchar, boolean } from 'drizzle-orm/pg-core'

export const LocationSchema = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  canonicalName: varchar('canonical_name', { length: 255 }),
  googleId: integer('google_id'),
  countryCode: varchar('country_code', { length: 10 }),
  targetType: varchar('target_type', { length: 50 }),
  isDeleted: boolean('is_deleted').notNull().default(false)
  // nameNormalized is a GENERATED column - created via custom SQL migration
})

export type LocationModel = typeof LocationSchema.$inferSelect
export type NewLocationModel = typeof LocationSchema.$inferInsert

// SQL para criar a tabela com extensões e índices:
// Este SQL deve ser executado manualmente ou via migration customizada
/*
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Adicionar coluna gerada (após criar tabela base via Drizzle)
ALTER TABLE locations
ADD COLUMN name_normalized VARCHAR(255) GENERATED ALWAYS AS (unaccent(lower(name))) STORED;

-- Criar índice trigram para busca
CREATE INDEX idx_locations_name_trgm ON locations USING gin (name_normalized gin_trgm_ops);
*/
