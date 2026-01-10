import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { DeleteCategoryOutput } from './dtos'

@Injectable()
export class DeleteCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(id: string): Promise<ModelOutput<DeleteCategoryOutput>> {
    try {
      // Validate input using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<DeleteCategoryOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find existing category
      const existingCategory = await this.repo.findById(id)

      if (!existingCategory) {
        return new ModelOutput<DeleteCategoryOutput>({
          data: null,
          hasError: true,
          error: { id: ['Category not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      // Delete in repository (soft delete)
      await this.repo.delete(existingCategory)

      return new ModelOutput<DeleteCategoryOutput>({
        data: { id, deleted: true },
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<DeleteCategoryOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
