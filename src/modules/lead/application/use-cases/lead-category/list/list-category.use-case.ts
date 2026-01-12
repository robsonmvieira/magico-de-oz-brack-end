import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryOutput } from '@modules/lead/application/use-cases/lead-category/list/dtos'
import { LeadCategoryMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'

@Injectable()
export class ListCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(): Promise<ModelCollectionOutput<LeadCategoryOutput>> {
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
