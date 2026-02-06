import {
  ListLeadUseCase,
  CreateLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase,
  SearchLeadUseCase,
  AutocompleteLeadUseCase,
  SearchLeadsByCriteriaUseCase,
  CreateFromCriteriaUseCase
} from '@modules/lead/application/use-cases/lead'
import { LeadRepository } from '../repositories'
import { RedisCacheRepository } from '@modules/shared/infra/cache'
import { GoogleMapsProvider } from '../services'

const REPOSITORY_PROVIDERS = {
  IGoogleMapsProvider: {
    provide: 'IGoogleMapsProvider',
    useClass: GoogleMapsProvider
  },
  ILeadRepository: {
    provide: 'ILeadRepository',
    useClass: LeadRepository
  },
  ICacheRepository: {
    provide: 'ICacheRepository',
    useClass: RedisCacheRepository
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
  },
  SearchLeadUseCase: {
    provide: SearchLeadUseCase,
    useClass: SearchLeadUseCase
  },
  AutocompleteLeadUseCase: {
    provide: AutocompleteLeadUseCase,
    useClass: AutocompleteLeadUseCase
  },
  SearchLeadsByCriteriaUseCase: {
    provide: SearchLeadsByCriteriaUseCase,
    useClass: SearchLeadsByCriteriaUseCase
  },
  CreateFromCriteriaUseCase: {
    provide: CreateFromCriteriaUseCase,
    useClass: CreateFromCriteriaUseCase
  }
} as const

export const LEAD_PROVIDERS = {
  REPOSITORY_PROVIDERS,
  USE_CASES_PROVIDERS
}
