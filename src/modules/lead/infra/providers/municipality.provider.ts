import { FindMunicipalityByCodeUseCase } from '@modules/lead/application/use-cases/municipality'

const USE_CASES_PROVIDERS = {
  FindMunicipalityByCodeUseCase: {
    provide: FindMunicipalityByCodeUseCase,
    useClass: FindMunicipalityByCodeUseCase
  }
} as const

export const MUNICIPALITY_PROVIDERS = {
  USE_CASES_PROVIDERS
}
