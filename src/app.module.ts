import { Module } from '@nestjs/common'

import { CoreModule } from '@modules/core/core.module'
import { LeadModule } from '@modules/lead/lead.module'
import { DatabaseModule } from '@modules/database/database.module'
import { EnvModule } from '@modules/env/env.module'
import { SharedModule } from '@modules/shared/shared.module'

@Module({
  imports: [CoreModule, LeadModule, DatabaseModule, EnvModule, SharedModule],
  controllers: [],
  providers: []
})
export class AppModule {}
