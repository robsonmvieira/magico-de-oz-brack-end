import {
  ListCategoryUseCase,
  CreateCategoryUseCase,
  GetCategoryByIdUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase
} from '@modules/lead/application/use-cases/lead-category'
import { LeadCategoryRepository, LocationRepository } from '../repositories'
import { RedisCacheRepository } from '@modules/shared/infra/cache'
import { IAClassifierCategory } from '../services'
import { SearchLocationUseCase } from '@modules/lead/application/use-cases/lead/search-location/search-location.use-case'

const REPOSITORY_PROVIDERS = {
  ILeadCategoryRepository: {
    provide: 'ILeadCategoryRepository',
    useClass: LeadCategoryRepository
  },
  ICategoryClassifierDomainService: {
    provide: 'ICategoryClassifierDomainService',
    useClass: IAClassifierCategory
  },
  ICacheRepository: {
    provide: 'ICacheRepository',
    useClass: RedisCacheRepository
  },
  ILocationRepository: {
    provide: 'ILocationRepository',
    useClass: LocationRepository
  }
} as const

const USE_CASES_PROVIDERS = {
  ListCategoryUseCase: {
    provide: ListCategoryUseCase,
    useClass: ListCategoryUseCase
  },
  CreateCategoryUseCase: {
    provide: CreateCategoryUseCase,
    useClass: CreateCategoryUseCase
  },
  GetCategoryByIdUseCase: {
    provide: GetCategoryByIdUseCase,
    useClass: GetCategoryByIdUseCase
  },
  UpdateCategoryUseCase: {
    provide: UpdateCategoryUseCase,
    useClass: UpdateCategoryUseCase
  },
  DeleteCategoryUseCase: {
    provide: DeleteCategoryUseCase,
    useClass: DeleteCategoryUseCase
  },
  SearchLocationUseCase: {
    provide: SearchLocationUseCase,
    useClass: SearchLocationUseCase
  }
} as const

export const LEAD_CATEGORY_PROVIDERS = {
  REPOSITORY_PROVIDERS,
  USE_CASES_PROVIDERS
}
