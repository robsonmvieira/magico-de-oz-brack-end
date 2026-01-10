import { ListLeadUseCase } from '@modules/lead/application/use-cases/lead/list/list-lead.use-case'
import { CreateLeadUseCase } from '@modules/lead/application/use-cases/lead/create/create-lead.use-case'
import { GetLeadByIdUseCase } from '@modules/lead/application/use-cases/lead/get-by-id/get-lead-by-id.use-case'
import { UpdateLeadUseCase } from '@modules/lead/application/use-cases/lead/update/update-lead.use-case'
import { DeleteLeadUseCase } from '@modules/lead/application/use-cases/lead/delete/delete-lead.use-case'
import { LeadRepository } from '../repositories'

const REPOSITORY_PROVIDERS = {
  ILeadRepository: {
    provide: 'ILeadRepository',
    useClass: LeadRepository
  }
} as const

const USE_CASES_PROVIDERS = {
  ListLeadUseCase: {
    provide: ListLeadUseCase,
    useClass: ListLeadUseCase
  },
  CreateLeadUseCase: {
    provide: CreateLeadUseCase,
    useClass: CreateLeadUseCase
  },
  GetLeadByIdUseCase: {
    provide: GetLeadByIdUseCase,
    useClass: GetLeadByIdUseCase
  },
  UpdateLeadUseCase: {
    provide: UpdateLeadUseCase,
    useClass: UpdateLeadUseCase
  },
  DeleteLeadUseCase: {
    provide: DeleteLeadUseCase,
    useClass: DeleteLeadUseCase
  }
} as const

export const LEAD_PROVIDERS = {
  REPOSITORY_PROVIDERS,
  USE_CASES_PROVIDERS
}
