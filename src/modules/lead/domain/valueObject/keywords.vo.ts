import { ValueObject } from '@modules/core/domain/valueObject'
import { KeywordVO } from './keyword.vo'

export class KeywordsVO extends ValueObject {
  readonly items: ReadonlyArray<KeywordVO>
  constructor(items: ReadonlyArray<KeywordVO>) {
    super()
    this.items = items
  }

  static create(keywords: string[]): KeywordsVO {
    const unique = [...new Set(keywords)]
    return new KeywordsVO(unique.map(k => KeywordVO.create(k)))
  }

  static empty(): KeywordsVO {
    return new KeywordsVO([])
  }

  add(keyword: KeywordVO): KeywordsVO {
    if (this.contains(keyword)) {
      return this
    }
    return new KeywordsVO([...this.items, keyword])
  }

  remove(keyword: KeywordVO): KeywordsVO {
    return new KeywordsVO(this.items.filter(k => !k.equals(keyword)))
  }

  contains(keyword: KeywordVO): boolean {
    return this.items.some(k => k.equals(keyword))
  }

  matchesAny(text: string): boolean {
    return this.items.some(k => k.matches(text))
  }

  countMatches(text: string): number {
    return this.items.filter(k => k.matches(text)).length
  }

  toArray(): string[] {
    return this.items.map(k => k.value)
  }

  get count(): number {
    return this.items.length
  }
}
