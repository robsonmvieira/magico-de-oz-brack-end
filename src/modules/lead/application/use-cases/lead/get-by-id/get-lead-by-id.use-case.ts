import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { GetLeadOutput } from './dtos'

@Injectable()
export class GetLeadByIdUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(id: string): Promise<ModelOutput<GetLeadOutput>> {
    try {
      // Validate input using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<GetLeadOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find lead
      const lead = await this.repo.findById(id)

      if (!lead) {
        return new ModelOutput<GetLeadOutput>({
          data: null,
          hasError: true,
          error: { id: ['Lead not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      return new ModelOutput<GetLeadOutput>({
        data: LeadMapper.toOutput(lead) as GetLeadOutput,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<GetLeadOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
