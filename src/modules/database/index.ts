import { NodePgDatabase } from 'drizzle-orm/node-postgres'

export * from './database.module'
export { DRIZZLE } from './database.module'

export type DrizzleDB = NodePgDatabase
