import { LeadCategoryEntity } from '../entities/lead-category.entity'
import { IRepository } from '@modules/core/domain/repositories'

export interface ILeadCategoryRepository extends IRepository<LeadCategoryEntity> {
  findByKeywordMatch(text: string): Promise<LeadCategoryEntity[]>
  findActive(): Promise<LeadCategoryEntity[]>
  findBySlug(slug: string): Promise<LeadCategoryEntity | null>
  findActive(): Promise<LeadCategoryEntity[]>
  findByKeywordMatch(text: string): Promise<LeadCategoryEntity[]>
  exists(id: string): Promise<boolean>
  existsByName(name: string): Promise<boolean>
}
