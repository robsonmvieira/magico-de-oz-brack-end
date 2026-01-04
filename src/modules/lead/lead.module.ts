import { Module } from '@nestjs/common'
import { LeadService } from './lead.service'
import {
  LeadCategoryController,
  LeadController
} from './application/controllers'
import { LEAD_CATEGORY_PROVIDERS } from './infra/providers'

@Module({
  controllers: [LeadController, LeadCategoryController],
  providers: [
    LeadService,
    ...Object.values(LEAD_CATEGORY_PROVIDERS.REPOSITORY_PROVIDERS),
    ...Object.values(LEAD_CATEGORY_PROVIDERS.USE_CASES_PROVIDERS)
  ]
})
export class LeadModule {}
