import { NodePgDatabase } from 'drizzle-orm/node-postgres'

export * from './database.module'
export { DRIZZLE, PG_POOL } from './database.module'

export type DrizzleDB = NodePgDatabase
