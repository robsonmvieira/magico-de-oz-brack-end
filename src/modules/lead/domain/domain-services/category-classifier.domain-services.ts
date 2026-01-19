import { LeadCategoryEntity } from '../entities'

export interface CategoryMatchResult {
  category: LeadCategoryEntity
  matchCount: number
  confidence: number // 0-100
}
export interface ICategoryClassifierDomainService<T = any> {
  findBestMatch(content: any): Promise<T>
}
