import { FindCnaeByCodeUseCase } from '@modules/lead/application/use-cases/cnae'

const USE_CASES_PROVIDERS = {
  FindCnaeByCodeUseCase: {
    provide: FindCnaeByCodeUseCase,
    useClass: FindCnaeByCodeUseCase
  }
} as const

export const CNAE_PROVIDERS = {
  USE_CASES_PROVIDERS
}
