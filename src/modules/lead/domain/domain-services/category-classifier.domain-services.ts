import { LeadCategoryEntity } from '../entities/lead-category.entity'

export interface CategoryMatchResult {
  category: LeadCategoryEntity
  matchCount: number
  confidence: number // 0-100
}
export interface ICategoryClassifierDomainService {
  findBestMatch(text: string): Promise<CategoryMatchResult | null>
}
