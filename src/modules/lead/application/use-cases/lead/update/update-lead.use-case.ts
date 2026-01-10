import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import {
  ILeadRepository,
  ILeadCategoryRepository
} from '@modules/lead/domain/repositories'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { IdParamDtoValidator } from '@modules/lead/application/dtos'
import { UpdateLeadInput, UpdateLeadOutput } from './dtos'
import {
  NameVO,
  PhoneVO,
  EmailVO,
  AddressVO,
  LeadCategoryId
} from '@modules/lead/domain/valueObject'

@Injectable()
export class UpdateLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ILeadCategoryRepository')
  private readonly categoryRepo: ILeadCategoryRepository

  async execute(
    id: string,
    input: UpdateLeadInput
  ): Promise<ModelOutput<UpdateLeadOutput>> {
    try {
      // Validate ID using DTO
      const validationErrors = IdParamDtoValidator.validate({ id })
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput<UpdateLeadOutput>({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Business rule: Find existing lead
      const existingLead = await this.repo.findById(id)

      if (!existingLead) {
        return new ModelOutput<UpdateLeadOutput>({
          data: null,
          hasError: true,
          error: { id: ['Lead not found'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      // Check if new category exists (if category is being updated)
      if (input.leadCategoryId) {
        const categoryExists = await this.categoryRepo.exists(
          input.leadCategoryId
        )
        if (!categoryExists) {
          return new ModelOutput<UpdateLeadOutput>({
            data: null,
            hasError: true,
            error: { leadCategoryId: ['Lead category not found'] },
            statusCode: HttpStatus.NOT_FOUND
          })
        }
      }

      // Check if new company name already exists (if name is being updated)
      if (input.companyName && input.companyName !== existingLead.companyName) {
        const companyExists = await this.repo.existsByCompanyName(
          input.companyName
        )
        if (companyExists) {
          return new ModelOutput<UpdateLeadOutput>({
            data: null,
            hasError: true,
            error: {
              companyName: ['Lead with this company name already exists']
            },
            statusCode: HttpStatus.CONFLICT
          })
        }
      }

      // Check if new email already exists (if email is being updated)
      if (input.email && input.email !== existingLead.email) {
        const emailExists = await this.repo.existsByEmail(input.email)
        if (emailExists) {
          return new ModelOutput<UpdateLeadOutput>({
            data: null,
            hasError: true,
            error: { email: ['Lead with this email already exists'] },
            statusCode: HttpStatus.CONFLICT
          })
        }
      }

      // Convert to entity for domain logic
      const entity = LeadMapper.toEntity(existingLead)

      // Apply updates
      if (input.leadCategoryId !== undefined) {
        entity._leadCategoryId = new LeadCategoryId(input.leadCategoryId)
      }

      if (input.companyName !== undefined) {
        entity._companyName = NameVO.create(input.companyName)
      }

      if (input.tradeName !== undefined) {
        entity._tradeName = input.tradeName || undefined
      }

      if (input.phone !== undefined) {
        entity._phone = input.phone ? PhoneVO.create(input.phone) : undefined
      }

      if (input.email !== undefined) {
        entity._email = input.email ? EmailVO.create(input.email) : undefined
      }

      if (input.website !== undefined) {
        entity._website = input.website || undefined
      }

      if (input.address !== undefined) {
        entity._address = input.address
          ? AddressVO.create(input.address)
          : undefined
      }

      // Mark as updated
      entity.updated_at = new Date()

      // Check entity validation (notifications)
      if (entity.notification?.hasError()) {
        return new ModelOutput<UpdateLeadOutput>({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // Update in repository
      const model = LeadMapper.toModel(entity)
      await this.repo.update(id, model)

      return new ModelOutput<UpdateLeadOutput>({
        data: LeadMapper.entityToOutput(entity) as UpdateLeadOutput,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<UpdateLeadOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
