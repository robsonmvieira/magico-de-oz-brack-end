import { Global, Module } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { EnvService } from '@modules/env'

export const DRIZZLE = Symbol('DRIZZLE')

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        const pool = new Pool({ connectionString: env.databaseUrl })
        return drizzle(pool)
      }
    }
  ],
  exports: [DRIZZLE]
})
export class DatabaseModule {}
