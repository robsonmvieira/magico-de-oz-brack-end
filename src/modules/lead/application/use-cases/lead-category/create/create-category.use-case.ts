import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryEntity } from '@modules/lead/domain/entities/lead-category.entity'
import { LeadCategoryMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { CreateLeadCategoryDtoValidator } from '@modules/lead/application/dtos'
import { CreateCategoryInput, CreateCategoryOutput } from './dtos'

@Injectable()
export class CreateCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(
    input: CreateCategoryInput
  ): Promise<ModelOutput<CreateCategoryOutput>> {
    try {
      // Validate input
      const validationErrors = CreateLeadCategoryDtoValidator.validate(input)
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<CreateCategoryOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Check if name already exists
      const nameExists = await this.repo.existsByName(input.name)
      if (nameExists) {
        return new ModelOutput<CreateCategoryOutput>({
          data: null,
          hasError: true,
          error: { name: ['Category with this name already exists'] },
          statusCode: HttpStatus.CONFLICT
        })
      }

      // Create entity
      const entity = LeadCategoryEntity.create({
        name: input.name,
        description: input.description,
        priority: input.priority,
        scoreBonus: input.scoreBonus,
        keywords: input.keywords,
        color: input.color
      })

      // Check entity validation (notifications)
      if (entity.notification?.hasError()) {
        return new ModelOutput<CreateCategoryOutput>({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Save to repository
      const model = LeadCategoryMapper.toModel(entity)
      await this.repo.save(model)

      return new ModelOutput<CreateCategoryOutput>({
        data: LeadCategoryMapper.entityToOutput(entity),
        hasError: false,
        error: null,
        statusCode: HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput<CreateCategoryOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
