import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { UpdateCategoryInput, UpdateCategoryOutput } from './dtos'

@Injectable()
export class UpdateCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(
    id: string,
    input: UpdateCategoryInput
  ): Promise<ModelOutput<UpdateCategoryOutput>> {
    try {
      // Validate input using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<UpdateCategoryOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find existing category
      const existingCategory = await this.repo.findById(id)

      if (!existingCategory) {
        return new ModelOutput<UpdateCategoryOutput>({
          data: null,
          hasError: true,
          error: { id: ['Category not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      // Check if new name already exists (if name is being updated)
      if (input.name && input.name !== existingCategory.name) {
        const nameExists = await this.repo.existsByName(input.name)
        if (nameExists) {
          return new ModelOutput<UpdateCategoryOutput>({
            data: null,
            hasError: true,
            error: { name: ['Category with this name already exists'] },
            statusCode: HttpStatus.CONFLICT
          })
        }
      }

      // Convert to entity for domain logic
      const entity = LeadCategoryMapper.toEntity(existingCategory)

      // Apply updates using domain methods
      if (input.name !== undefined) {
        entity.rename(input.name)
      }

      if (input.description !== undefined) {
        entity.updateDescription(input.description)
      }

      if (input.priority !== undefined) {
        entity.changePriority(input.priority)
      }

      if (input.scoreBonus !== undefined) {
        entity.changeScoreBonus(input.scoreBonus)
      }

      if (input.color !== undefined) {
        entity.changeColor(input.color)
      }

      if (input.keywords !== undefined) {
        // Clear existing keywords and add new ones
        const newKeywords = input.keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0)
        entity._keywords.items.forEach(k => entity.removeKeyword(k.value))
        newKeywords.forEach(k => entity.addKeyword(k))
      }

      // Check entity validation (notifications)
      if (entity.notification?.hasError()) {
        return new ModelOutput<UpdateCategoryOutput>({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Update in repository
      const model = LeadCategoryMapper.toModel(entity)
      await this.repo.update(id, model)

      return new ModelOutput<UpdateCategoryOutput>({
        data: LeadCategoryMapper.entityToOutput(entity),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<UpdateCategoryOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
