import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadPartnerQualificationMapper } from '@modules/lead/application/mappers/lead-partner-qualification.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindLeadPartnerQualificationByCodeOutput } from './dtos'

@Injectable()
export class FindLeadPartnerQualificationByCodeUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    code: string
  ): Promise<ModelOutput<FindLeadPartnerQualificationByCodeOutput>> {
    try {
      if (!code) {
        return new ModelOutput<FindLeadPartnerQualificationByCodeOutput>({
          data: null,
          hasError: true,
          error: { code: ['Code is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findLeadPartnerQualificationByCode(code)

      if (!model) {
        return new ModelOutput<FindLeadPartnerQualificationByCodeOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindLeadPartnerQualificationByCodeOutput>({
        data: LeadPartnerQualificationMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindLeadPartnerQualificationByCodeOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
