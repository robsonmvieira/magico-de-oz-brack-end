import { FindLegalNatureByCodeUseCase } from '@modules/lead/application/use-cases/legal-nature'

const USE_CASES_PROVIDERS = {
  FindLegalNatureByCodeUseCase: {
    provide: FindLegalNatureByCodeUseCase,
    useClass: FindLegalNatureByCodeUseCase
  }
} as const

export const LEGAL_NATURE_PROVIDERS = {
  USE_CASES_PROVIDERS
}
