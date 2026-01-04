import { ModelCollectionOutput } from '@modules/core/application/usecases/common'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { LeadCategoryOutput } from './dtos'
import { CategoryLeadMapper } from '@modules/lead/application/mappers/category-lead.mapper'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class ListCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(): Promise<ModelCollectionOutput<LeadCategoryOutput>> {
    const items = await this.repo.findAll()
    return new ModelCollectionOutput<LeadCategoryOutput>({
      data: items.map(CategoryLeadMapper.toOutput),
      hasError: false,
      error: null
    })
  }
}
