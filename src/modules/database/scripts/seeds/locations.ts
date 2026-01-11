import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { LocationSchema } from '@modules/lead/domain/models/location.model'
import locationsData from './locations.json'

type LocationData = {
  name: string
  canonicalName: string
  googleId: number
  countryCode: string
  targetType: string
}

const data = locationsData as LocationData[]

export async function seedLocations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const db = drizzle(pool)

  const BATCH_SIZE = 1000

  console.log(`Starting seed of ${data.length} locations...`)

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE).map(loc => ({
      name: loc.name,
      canonicalName: loc.canonicalName,
      googleId: loc.googleId,
      countryCode: loc.countryCode,
      targetType: loc.targetType
    }))

    await db.insert(LocationSchema).values(batch)
    console.log(
      `Inserted ${Math.min(i + BATCH_SIZE, data.length)}/${data.length}`
    )
  }

  console.log('Seed completed!')

  console.log('Creating extensions and indexes...')

  const client = await pool.connect()
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent')

    // Criar função immutable wrapper para unaccent
    await client.query(`
      CREATE OR REPLACE FUNCTION immutable_unaccent(text)
      RETURNS text AS $$
        SELECT unaccent('unaccent', $1)
      $$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE STRICT
    `)

    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS name_normalized VARCHAR(255)
      GENERATED ALWAYS AS (immutable_unaccent(lower(name))) STORED
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_name_trgm
      ON locations USING gin (name_normalized gin_trgm_ops)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_country
      ON locations (country_code)
    `)
    console.log('Extensions and indexes created!')
  } finally {
    client.release()
  }

  await pool.end()
}

seedLocations().catch(console.error)
