import { Module } from '@nestjs/common'
import { LeadService } from './lead.service'
import {
  LeadCategoryController,
  LeadController
} from './application/controllers'

@Module({
  controllers: [LeadController, LeadCategoryController],
  providers: [LeadService]
})
export class LeadModule {}
