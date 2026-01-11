import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { Redis } from 'ioredis'
import { EnvService } from '@modules/env'

export const DRIZZLE = Symbol('DRIZZLE')
export const PG_POOL = Symbol('PG_POOL')
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

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
    },
    {
      provide: REDIS_CLIENT,
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        const config = env.redisConfig
        return new Redis({
          host: config.host,
          port: config.port,
          password: config.password || undefined
        })
      }
    }
  ],
  exports: [DRIZZLE, PG_POOL, REDIS_CLIENT]
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end()
    }
    if (this.redis) {
      await this.redis.quit()
    }
  }
}
