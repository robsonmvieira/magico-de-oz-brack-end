import { FindLeadPartnerQualificationByCodeUseCase } from '@modules/lead/application/use-cases/lead-partner-qualification'

const USE_CASES_PROVIDERS = {
  FindLeadPartnerQualificationByCodeUseCase: {
    provide: FindLeadPartnerQualificationByCodeUseCase,
    useClass: FindLeadPartnerQualificationByCodeUseCase
  }
} as const

export const LEAD_PARTNER_QUALIFICATION_PROVIDERS = {
  USE_CASES_PROVIDERS
}
