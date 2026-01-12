import { ListCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/list/list-category.use-case'
import { CreateCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/create/create-category.use-case'
import { GetCategoryByIdUseCase } from '@modules/lead/application/use-cases/lead-category/get-by-id/get-category-by-id.use-case'
import { UpdateCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/update/update-category.use-case'
import { DeleteCategoryUseCase } from '@modules/lead/application/use-cases/lead-category/delete/delete-category.use-case'
import { LeadCategoryRepository, LocationRepository } from '../repositories'
import { RedisCacheRepository } from '@modules/shared/infra/cache'
import { KeywordCategoryClassifier } from '../services'
import { SearchLocationUseCase } from '@modules/lead/application/use-cases/lead/search-location/search-location.use-case'

const REPOSITORY_PROVIDERS = {
  ILeadCategoryRepository: {
    provide: 'ILeadCategoryRepository',
    useClass: LeadCategoryRepository
  },
  ICategoryClassifierDomainService: {
    provide: 'ICategoryClassifierDomainService',
    useClass: KeywordCategoryClassifier
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
