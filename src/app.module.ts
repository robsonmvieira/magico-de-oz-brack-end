import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CoreModule } from '@modules/core/core.module'
import { LeadModule } from '@modules/lead/lead.module'
import { DatabaseModule } from '@modules/database/database.module'
import { EnvModule } from '@modules/env/env.module'

@Module({
  imports: [CoreModule, LeadModule, DatabaseModule, EnvModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
