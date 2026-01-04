import { BaseRepository } from '@modules/core/infra/repositories/repository'
import { LeadCategoryEntity } from '@modules/lead/domain/entities/lead-category.entity'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'

export class LeadCategoryRepository
  extends BaseRepository<LeadCategoryEntity>
  implements ILeadCategoryRepository
{
  async findByKeywordMatch(text: string): Promise<LeadCategoryEntity[]> {
    return await this.findByKeywordMatch(text)
  }
  async findActive(): Promise<LeadCategoryEntity[]> {
    return []
  }
  async findBySlug(slug: string): Promise<LeadCategoryEntity | null> {
    return await this.findBySlug(slug)
  }
  async exists(id: string): Promise<boolean> {
    return await this.exists(id)
  }
  async existsByName(name: string): Promise<boolean> {
    return await this.existsByName(name)
  }
}
