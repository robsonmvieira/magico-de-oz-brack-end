import { FindPartnerByCnpjUseCase } from '@modules/lead/application/use-cases/partner'

const USE_CASES_PROVIDERS = {
  FindPartnerByCnpjUseCase: {
    provide: FindPartnerByCnpjUseCase,
    useClass: FindPartnerByCnpjUseCase
  }
} as const

export const PARTNER_PROVIDERS = {
  USE_CASES_PROVIDERS
}
