import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { GetCategoryOutput } from './dtos'

@Injectable()
export class GetCategoryByIdUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(id: string): Promise<ModelOutput<GetCategoryOutput>> {
    try {
      // Validate input using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<GetCategoryOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find category
      const category = await this.repo.findById(id)

      if (!category) {
        return new ModelOutput<GetCategoryOutput>({
          data: null,
          hasError: true,
          error: { id: ['Category not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      return new ModelOutput<GetCategoryOutput>({
        data: LeadCategoryMapper.toOutput(category),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<GetCategoryOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
