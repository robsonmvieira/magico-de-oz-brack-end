import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { LeadService } from './lead.service'
import {
  LeadCategoryController,
  LeadController,
  SimpleController,
  PartnerController,
  CountryController
} from './application/controllers'
import {
  LEAD_CATEGORY_PROVIDERS,
  LEAD_PROVIDERS,
  PARTNER_PROVIDERS,
  COUNTRY_PROVIDERS
} from './infra/providers'
import { SharedModule } from '@modules/shared/shared.module'
import { SIMPLE_PROVIDERS } from './infra/providers/simple.provider'
import {
  SimpleImportProcessor,
  SIMPLE_IMPORT_QUEUE,
  PartnerImportProcessor,
  PARTNER_IMPORT_QUEUE,
  CountryImportProcessor,
  COUNTRY_IMPORT_QUEUE
} from './infra/queues'
import { EnvModule, EnvService } from '@modules/env'

@Module({
  imports: [
    SharedModule,
    EnvModule,
    BullModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        redis: {
          host: env.redisHost,
          port: env.redisPort,
          password: env.redisPassword || undefined
        }
      })
    }),
    BullModule.registerQueue(
      { name: SIMPLE_IMPORT_QUEUE },
      { name: PARTNER_IMPORT_QUEUE },
      { name: COUNTRY_IMPORT_QUEUE }
    )
  ],
  controllers: [
    LeadController,
    LeadCategoryController,
    SimpleController,
    PartnerController,
    CountryController
  ],
  providers: [
    LeadService,
    SimpleImportProcessor,
    PartnerImportProcessor,
    CountryImportProcessor,
    ...Object.values(LEAD_CATEGORY_PROVIDERS.REPOSITORY_PROVIDERS),
    ...Object.values(LEAD_CATEGORY_PROVIDERS.USE_CASES_PROVIDERS),
    ...Object.values(LEAD_PROVIDERS.REPOSITORY_PROVIDERS),
    ...Object.values(LEAD_PROVIDERS.USE_CASES_PROVIDERS),
    ...Object.values(SIMPLE_PROVIDERS.SERVICE_PROVIDERS),
    ...Object.values(SIMPLE_PROVIDERS.USE_CASES_PROVIDERS),
    ...Object.values(PARTNER_PROVIDERS.USE_CASES_PROVIDERS),
    ...Object.values(COUNTRY_PROVIDERS.USE_CASES_PROVIDERS)
  ]
})
export class LeadModule {}
