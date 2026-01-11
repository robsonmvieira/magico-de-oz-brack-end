import { Module } from '@nestjs/common'
import { RedisCacheRepository } from './infra/cache'

@Module({
  providers: [RedisCacheRepository],
  exports: [RedisCacheRepository]
})
export class SharedModule {}
