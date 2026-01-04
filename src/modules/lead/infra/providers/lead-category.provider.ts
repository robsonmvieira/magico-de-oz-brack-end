import { ListCategoryUseCase } from '@modules/lead/application/usecases/lead-category/list/list-category.use-case'
import { LeadCategoryRepository } from '../repositories'

const REPOSITORY_PROVIDERS = {
  ILeadCategoryRepository: {
    provide: 'ILeadCategoryRepository',
    useClass: LeadCategoryRepository
  }
} as const

const USE_CASES_PROVIDERS = {
  ListCategoryUseCase: {
    provide: ListCategoryUseCase,
    useClass: ListCategoryUseCase
  }
} as const

export const LEAD_CATEGORY_PROVIDERS = {
  REPOSITORY_PROVIDERS,
  USE_CASES_PROVIDERS
}
