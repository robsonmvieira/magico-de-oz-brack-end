import { Inject, Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import { ICacheRepository } from '@modules/core/domain/repositories'
import { REDIS_CLIENT } from '@modules/database'

@Injectable()
export class RedisCacheRepository implements ICacheRepository {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttl)
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }
}
