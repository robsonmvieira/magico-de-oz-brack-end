import { Entity } from '@modules/core/domain/entities/entity'
import { LeadCategoryId } from '../valueObject/lead-category.uuid'
import { ValueObject } from '@modules/core/domain/valueObject'
import {
  CategoryColorVO,
  KeywordsVO,
  KeywordVO,
  NameVO,
  PriorityVO,
  ScoreBonusVO,
  SlugVO
} from '../valueObject'
import { LeadCategoryFakeBuilder } from '@modules/lead/tests/lead-category.fake-builder'

// ============================================================
// INTERFACES - Contratos de dados
// ============================================================

export interface ISectorDefinition {
  code: string
  name: string
  keywords: string[]
  parentCode?: string // Para hierarquia
}

export interface IScoreBreakdown {
  factor: string
  points: number
  reason: string
}

export interface ICategoryScores {
  completeness: number // 0-100
  icpFit: number // 0-100
  dataQuality: number // 0-100
  overall: number // 0-100 (média ponderada)
}

type CreateLeadCategoryCommand = {
  name: string
  description?: string
  priority?: number
  scoreBonus?: number
  keywords?: string[]
  color?: string
}
type LeadCategoryProps = {
  name: string
  slug: string
  description?: string
  priority: number
  scoreBonus: number
  keywords: string[]
  color: string

  id?: LeadCategoryId
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
  is_active?: boolean
  is_deleted?: boolean
  is_blocked?: boolean
}

export class LeadCategoryEntity extends Entity {
  _name: NameVO
  _slug: SlugVO
  _description?: string
  _priority: PriorityVO
  _scoreBonus: ScoreBonusVO
  _keywords: KeywordsVO
  _color: CategoryColorVO

  private constructor({
    name,
    slug,
    description,
    priority,
    scoreBonus,
    keywords,
    color,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: LeadCategoryProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._name = NameVO.create(name)
    this._slug = SlugVO.create(slug)
    this._description = description
    this._priority = PriorityVO.create(priority)
    this._scoreBonus = ScoreBonusVO.create(scoreBonus)
    this._keywords = KeywordsVO.create(keywords)
    this._color = CategoryColorVO.create(color)
  }

  static reconstitute(props: LeadCategoryProps): LeadCategoryEntity {
    return new LeadCategoryEntity(props)
  }

  static create({
    name,
    description,
    priority = 3,
    scoreBonus = 0,
    keywords = [],
    color = 'gray'
  }: CreateLeadCategoryCommand): LeadCategoryEntity {
    const slug = SlugVO.fromName(name)
    return new LeadCategoryEntity({
      name,
      slug: slug.value,
      description,
      priority,
      scoreBonus,
      keywords,
      color
    })
  }

  static fake() {
    return LeadCategoryFakeBuilder
  }

  rename(newName: string): void {
    this._name = NameVO.create(newName)
    this._slug = SlugVO.fromName(newName)
    this.touch()
  }

  updateDescription(description: string | undefined): void {
    this._description = description?.trim()
    this.touch()
  }

  changePriority(priority: number): void {
    this._priority = PriorityVO.create(priority)
    this.touch()
  }

  changeScoreBonus(bonus: number): void {
    this._scoreBonus = ScoreBonusVO.create(bonus)
    this.touch()
  }

  changeColor(color: string): void {
    this._color = CategoryColorVO.create(color)
    this.touch()
  }

  addKeyword(keyword: string): void {
    this._keywords = this._keywords.add(KeywordVO.create(keyword))
    this.touch()
  }

  removeKeyword(keyword: string): void {
    this._keywords = this._keywords.remove(KeywordVO.create(keyword))
    this.touch()
  }

  activate(): void {
    if (this.is_active) return
    this.setActive(true)
    this.touch()
  }

  deactivate(): void {
    if (!this.is_active) return
    this.setActive(false)
    this.touch()
  }
  getPriority(): PriorityVO {
    return this._priority
  }

  // -------------------- Domain Logic --------------------

  /**
   * Verifica se um texto (ex: nome da empresa, categoria do Google)
   * combina com as keywords desta categoria
   */
  matchesText(text: string): boolean {
    return this._keywords.matchesAny(text)
  }

  /**
   * Retorna quantas keywords combinam com o texto
   * Útil para ranking de categorias
   */
  countMatches(text: string): number {
    return this._keywords.countMatches(text)
  }

  /**
   * Calcula a pontuação que esta categoria adiciona a um lead
   */
  calculateBonusScore(): number {
    return this._scoreBonus.value
  }

  /**
   * Verifica se esta categoria tem prioridade maior que outra
   */
  hasHigherPriorityThan(other: LeadCategoryEntity): boolean {
    return this._priority.isHigherThan(other.getPriority())
  }

  // -------------------- Private Helpers --------------------

  get entity_id(): ValueObject {
    return this.id
  }
  toJSON() {
    return {
      id: this.id.id,
      name: this._name.value,
      slug: this._slug.value,
      description: this._description,
      priority: this._priority.value,
      scoreBonus: this._scoreBonus.value,
      keywords: this._keywords.items.map(k => k.value),
      color: this._color.value
    }
  }
}
