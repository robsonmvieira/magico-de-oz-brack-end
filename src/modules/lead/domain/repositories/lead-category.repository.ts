import {
  LeadCategoryModel,
  NewLeadCategoryModel
} from '../models/lead-category.model'
import { IRepository } from '@modules/core/domain/repositories'

export interface ILeadCategoryRepository extends IRepository<
  LeadCategoryModel,
  NewLeadCategoryModel
> {
  findByKeywordMatch(text: string): Promise<LeadCategoryModel[]>
  findActive(): Promise<LeadCategoryModel[]>
  findBySlug(slug: string): Promise<LeadCategoryModel | null>
  exists(id: string): Promise<boolean>
  existsByName(name: string): Promise<boolean>
}
