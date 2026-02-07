import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { DeleteLeadOutput } from './dtos'

@Injectable()
export class DeleteLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(id: string): Promise<ModelOutput<DeleteLeadOutput>> {
    try {
      // Validate input using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<DeleteLeadOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find existing lead
      const existingLead = await this.repo.findById(id)

      if (!existingLead) {
        return new ModelOutput<DeleteLeadOutput>({
          data: null,
          hasError: true,
          error: { id: ['Lead not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      // Delete in repository (soft delete)
      await this.repo.delete(existingLead)

      return new ModelOutput<DeleteLeadOutput>({
        data: { id, deleted: true },
        hasError: false,
        error: null,
        statusCode: HttpStatus.NO_CONTENT
      })
    } catch (error) {
      return new ModelOutput<DeleteLeadOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
