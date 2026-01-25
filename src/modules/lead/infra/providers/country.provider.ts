import { FindCountryByCodeUseCase } from '@modules/lead/application/use-cases/country'

const USE_CASES_PROVIDERS = {
  FindCountryByCodeUseCase: {
    provide: FindCountryByCodeUseCase,
    useClass: FindCountryByCodeUseCase
  }
} as const

export const COUNTRY_PROVIDERS = {
  USE_CASES_PROVIDERS
}
