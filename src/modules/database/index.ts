import { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { ExtractTablesWithRelations } from 'drizzle-orm'

export * from './database.module'
export { DRIZZLE, PG_POOL, REDIS_CLIENT } from './database.module'

export type DrizzleDB = NodePgDatabase

export type DrizzleTransaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>

export type DrizzleClient = DrizzleDB | DrizzleTransaction
