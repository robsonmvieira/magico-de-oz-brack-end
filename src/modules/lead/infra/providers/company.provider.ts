import { FindCompanyByBasicCnpjUseCase } from '@modules/lead/application/use-cases/company'

const USE_CASES_PROVIDERS = {
  FindCompanyByBasicCnpjUseCase: {
    provide: FindCompanyByBasicCnpjUseCase,
    useClass: FindCompanyByBasicCnpjUseCase
  }
} as const

export const COMPANY_PROVIDERS = {
  USE_CASES_PROVIDERS
}
