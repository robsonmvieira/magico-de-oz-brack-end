import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadSituationChangeReasonMapper } from '@modules/lead/application/mappers/lead-situation-change-reason.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindLeadSituationChangeReasonByCodeOutput } from './dtos'

@Injectable()
export class FindLeadSituationChangeReasonByCodeUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    code: string
  ): Promise<ModelOutput<FindLeadSituationChangeReasonByCodeOutput>> {
    try {
      if (!code) {
        return new ModelOutput<FindLeadSituationChangeReasonByCodeOutput>({
          data: null,
          hasError: true,
          error: { code: ['Code is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findLeadSituationChangeReasonByCode(code)

      if (!model) {
        return new ModelOutput<FindLeadSituationChangeReasonByCodeOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindLeadSituationChangeReasonByCodeOutput>({
        data: LeadSituationChangeReasonMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindLeadSituationChangeReasonByCodeOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
