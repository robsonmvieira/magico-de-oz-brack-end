import { LeadCategoryMapper } from '@modules/lead/application/mappers'
import {
  CategoryMatchResult,
  ICategoryClassifierDomainService
} from '@modules/lead/domain/domain-services'
import { LeadCategoryEntity } from '@modules/lead/domain/entities'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class KeywordCategoryClassifier implements ICategoryClassifierDomainService {
  @Inject('ILeadCategoryRepository')
  private readonly repository: ILeadCategoryRepository

  async findBestMatch(text: string): Promise<CategoryMatchResult | null> {
    const categoriesModel = await this.repository.findByKeywordMatch(text)

    if (!categoriesModel.length) {
      return null
    }

    const normalizedText = text.toLowerCase()
    const textWords = normalizedText.split(/\s+/)

    const results = categoriesModel
      .map(model => {
        const entity = LeadCategoryMapper.toEntity(model)
        const matchCount = this.countKeywordMatches(
          entity,
          normalizedText,
          textWords
        )
        const keywords = entity._keywords.items
        const confidence = Math.round((matchCount / keywords.length) * 100)
        return { category: entity, matchCount, confidence }
      })
      .filter(result => result.matchCount > 0)

    if (!results.length) {
      return null
    }

    return results.reduce(
      (best, current) =>
        current.confidence > best.confidence ? current : best,
      results[0]
    )
  }

  private countKeywordMatches(
    entity: LeadCategoryEntity,
    normalizedText: string,
    textWords: string[]
  ): number {
    const keywords = entity._keywords.items.map(k => k.value.toLowerCase())

    return keywords.reduce((count, keyword) => {
      const isMatch = this.keywordMatchesText(
        keyword,
        normalizedText,
        textWords
      )
      return isMatch ? count + 1 : count
    }, 0)
  }

  private keywordMatchesText(
    keyword: string,
    normalizedText: string,
    textWords: string[]
  ): boolean {
    const keywordWords = keyword.split(/\s+/)

    if (keywordWords.length > 1) {
      return normalizedText.includes(keyword)
    }

    return textWords.some(
      word => word.includes(keyword) || keyword.includes(word)
    )
  }
}
