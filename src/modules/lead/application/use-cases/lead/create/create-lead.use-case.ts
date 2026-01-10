import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository, ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadEntity } from '@modules/lead/domain/entities/lead.entity'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { CreateLeadDtoValidator } from '@modules/lead/application/dtos'
import { CreateLeadInput, CreateLeadOutput } from './dtos'

@Injectable()
export class CreateLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ILeadCategoryRepository')
  private readonly categoryRepo: ILeadCategoryRepository

  async execute(input: CreateLeadInput): Promise<ModelOutput<CreateLeadOutput>> {
    try {
      // Validate input
      const validationErrors = CreateLeadDtoValidator.validate(input)
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<CreateLeadOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Check if category exists
      const categoryExists = await this.categoryRepo.exists(input.leadCategoryId)
      if (!categoryExists) {
        return new ModelOutput<CreateLeadOutput>({
          data: null,
          hasError: true,
          error: { leadCategoryId: ['Lead category not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      // Check if company name already exists
      const companyExists = await this.repo.existsByCompanyName(input.companyName)
      if (companyExists) {
        return new ModelOutput<CreateLeadOutput>({
          data: null,
          hasError: true,
          error: { companyName: ['Lead with this company name already exists'] },
          statusCode: HttpStatus.CONFLICT
        })
      }

      // Check if email already exists (if provided)
      if (input.email) {
        const emailExists = await this.repo.existsByEmail(input.email)
        if (emailExists) {
          return new ModelOutput<CreateLeadOutput>({
            data: null,
            hasError: true,
            error: { email: ['Lead with this email already exists'] },
            statusCode: HttpStatus.CONFLICT
          })
        }
      }

      // Create entity
      const entity = LeadEntity.create({
        leadCategoryId: input.leadCategoryId,
        companyName: input.companyName,
        source: input.source,
        tradeName: input.tradeName,
        phone: input.phone,
        email: input.email,
        website: input.website,
        address: input.address
      })

      // Check entity validation (notifications)
      if (entity.notification?.hasError()) {
        return new ModelOutput<CreateLeadOutput>({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Save to repository
      const model = LeadMapper.toModel(entity)
      await this.repo.save(model)

      return new ModelOutput<CreateLeadOutput>({
        data: LeadMapper.entityToOutput(entity) as CreateLeadOutput,
        hasError: false,
        error: null,
        statusCode: HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput<CreateLeadOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
