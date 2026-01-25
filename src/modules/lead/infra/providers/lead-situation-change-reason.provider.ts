import { FindLeadSituationChangeReasonByCodeUseCase } from '@modules/lead/application/use-cases/lead-situation-change-reason'

const USE_CASES_PROVIDERS = {
  FindLeadSituationChangeReasonByCodeUseCase: {
    provide: FindLeadSituationChangeReasonByCodeUseCase,
    useClass: FindLeadSituationChangeReasonByCodeUseCase
  }
} as const

export const LEAD_SITUATION_CHANGE_REASON_PROVIDERS = {
  USE_CASES_PROVIDERS
}
