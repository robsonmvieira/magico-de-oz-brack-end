import { LeadCategoryEntity } from '../entities'

export interface CategoryMatchResult {
  category: LeadCategoryEntity
  matchCount: number
  confidence: number // 0-100
}
export interface ICategoryClassifierDomainService<T = any, TBatch = T> {
  findBestMatch(content: any): Promise<T>
  classifyChunk(content: any[]): Promise<TBatch[]>
}
