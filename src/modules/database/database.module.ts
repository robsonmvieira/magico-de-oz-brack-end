import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { EnvService } from '@modules/env'

export const DRIZZLE = Symbol('DRIZZLE')
export const PG_POOL = Symbol('PG_POOL')

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        return new Pool({ connectionString: env.databaseUrl })
      }
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => {
        return drizzle(pool)
      }
    }
  ],
  exports: [DRIZZLE, PG_POOL]
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end()
    }
  }
}
