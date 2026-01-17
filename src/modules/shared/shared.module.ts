import { Module } from '@nestjs/common'
import { RedisCacheRepository } from './infra/cache'
import { UOW_PROVIDER } from './infra/providers'

@Module({
  providers: [RedisCacheRepository, UOW_PROVIDER],
  exports: [RedisCacheRepository, UOW_PROVIDER]
})
export class SharedModule {}
