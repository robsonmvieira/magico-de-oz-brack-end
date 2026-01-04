import { LeadCategoryEntity } from '../entities/lead-category.entity'
import { LeadCategoryId, NameVO, SlugVO } from '../valueObject'
import { IRepository } from '@modules/core/domain/repositories'

export interface LeadCategoryRepository extends IRepository<LeadCategoryEntity> {
  findByKeywordMatch(text: string): Promise<LeadCategoryEntity[]>
  findActive(): Promise<LeadCategoryEntity[]>
  findBySlug(slug: SlugVO): Promise<LeadCategoryEntity | null>
  findActive(): Promise<LeadCategoryEntity[]>
  findByKeywordMatch(text: string): Promise<LeadCategoryEntity[]>
  exists(id: LeadCategoryId): Promise<boolean>
  existsByName(name: NameVO): Promise<boolean>
}
