import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryOutput } from '@modules/lead/application/use-cases/lead-category/list/dtos'
import { LeadCategoryMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import {
  PaginatedOutput,
  ModelCollectionOutput
} from '@modules/core/application/use-cases/common'
import { PaginationParams } from '@modules/core/domain/repositories'

export interface ListCategoryInput extends PaginationParams {}

@Injectable()
export class ListCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(
    input: ListCategoryInput = {}
  ): Promise<PaginatedOutput<LeadCategoryOutput>> {
    try {
      const { page = 1, limit = 10, sortBy, sortOrder, search } = input

      const result = await this.repo.findAllPaginated({
        page,
        limit,
        sortBy,
        sortOrder,
        search
      })

      const output = result.data.map(LeadCategoryMapper.toOutput)

      return new PaginatedOutput<LeadCategoryOutput>({
        data: output,
        totalItems: result.totalItems,
        page: result.page,
        limit: result.limit,
        hasError: false,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return PaginatedOutput.error<LeadCategoryOutput>(
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Keep backward compatibility
  async executeAll(): Promise<ModelCollectionOutput<LeadCategoryOutput>> {
    try {
      const items = await this.repo.findAll()
      return new ModelCollectionOutput<LeadCategoryOutput>({
        data: items.map(LeadCategoryMapper.toOutput),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelCollectionOutput<LeadCategoryOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
