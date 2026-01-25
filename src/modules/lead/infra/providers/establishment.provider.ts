import { FindEstablishmentByFullCnpjUseCase } from '@modules/lead/application/use-cases/establishment'

const USE_CASES_PROVIDERS = {
  FindEstablishmentByFullCnpjUseCase: {
    provide: FindEstablishmentByFullCnpjUseCase,
    useClass: FindEstablishmentByFullCnpjUseCase
  }
} as const

export const ESTABLISHMENT_PROVIDERS = {
  USE_CASES_PROVIDERS
}
