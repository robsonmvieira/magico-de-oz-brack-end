import { Chance } from 'chance'
import { LeadCategoryId } from '../domain/valueObject'
import { LeadCategoryEntity } from '../domain/entities/lead-category.entity'

type PropertyOrFactory<T> = T | ((index: number) => T)

export class LeadCategoryFakeBuilder<TBuild = any> {
  private readonly countsObjs: number
  private readonly chance: Chance.Chance

  private constructor(counts: number = 1) {
    this.countsObjs = counts
    this.chance = new Chance()
  }

  private _id: PropertyOrFactory<LeadCategoryId> | undefined = undefined

  private _name: PropertyOrFactory<string> = () => this.nameGenerate()

  private _slug: PropertyOrFactory<string> | undefined = undefined

  private _description: PropertyOrFactory<string | undefined> = () =>
    this.descriptionGenerate()

  private _priority: PropertyOrFactory<number> = () => this.priorityGenerate()

  private _scoreBonus: PropertyOrFactory<number> = () =>
    this.scoreBonusGenerate()

  private _keywords: PropertyOrFactory<string[]> = () => this.keywordsGenerate()

  private _color: PropertyOrFactory<string> = () => this.colorGenerate()

  private _is_active: PropertyOrFactory<boolean> = () => true

  private _is_deleted: PropertyOrFactory<boolean> = () => false

  private _is_blocked: PropertyOrFactory<boolean> = () => false

  private _created_at: PropertyOrFactory<Date> | undefined = undefined

  private _updated_at: PropertyOrFactory<Date> | undefined = undefined

  private _deleted_at: PropertyOrFactory<Date> | undefined = undefined

  // ============================================================
  // GENERATORS
  // ============================================================

  private nameGenerate(): string {
    const adjective = this.chance.capitalize(this.chance.word({ length: 6 }))
    const noun = this.chance.capitalize(this.chance.word({ length: 8 }))
    return `${adjective} ${noun}`
  }

  private descriptionGenerate(): string {
    return this.chance.sentence({ words: 10 })
  }

  private priorityGenerate(): number {
    return this.chance.integer({ min: 1, max: 5 })
  }

  private scoreBonusGenerate(): number {
    return this.chance.integer({ min: 0, max: 50 })
  }

  private keywordsGenerate(): string[] {
    const count = this.chance.integer({ min: 2, max: 6 })
    return Array.from({ length: count }, () =>
      this.chance.word({ length: this.chance.integer({ min: 4, max: 10 }) })
    )
  }

  private colorGenerate(): string {
    const validColors = [
      'gray',
      'red',
      'orange',
      'yellow',
      'green',
      'teal',
      'blue',
      'indigo',
      'purple',
      'pink'
    ]
    return this.chance.pickone(validColors)
  }

  // ============================================================
  // STATIC CONSTRUCTORS
  // ============================================================

  static aCategory(): LeadCategoryFakeBuilder<LeadCategoryEntity> {
    return new LeadCategoryFakeBuilder<LeadCategoryEntity>()
  }

  static theCategories(
    counts: number
  ): LeadCategoryFakeBuilder<LeadCategoryEntity[]> {
    return new LeadCategoryFakeBuilder<LeadCategoryEntity[]>(counts)
  }

  // ============================================================
  // BUILD
  // ============================================================

  build(): TBuild {
    const categories = new Array(this.countsObjs)
      .fill(undefined)
      .map((_, index) => {
        const name = this.callFactory(this._name, index)
        const slug = this._slug
          ? this.callFactory(this._slug, index)
          : name
              .toLowerCase()
              .normalize('NFD')
              .replaceAll(/[\u0300-\u036f]/g, '')
              .replaceAll(/[^a-z0-9]+/g, '-')
              .replace(/^-+/, '')
              .replace(/-+$/, '')

        return LeadCategoryEntity.reconstitute({
          id: this._id ? this.callFactory(this._id, index) : undefined,
          name,
          slug,
          description: this.callFactory(this._description, index),
          priority: this.callFactory(this._priority, index),
          scoreBonus: this.callFactory(this._scoreBonus, index),
          keywords: this.callFactory(this._keywords, index),
          color: this.callFactory(this._color, index),
          is_active: this.callFactory(this._is_active, index),
          is_deleted: this.callFactory(this._is_deleted, index),
          is_blocked: this.callFactory(this._is_blocked, index),
          created_at: this._created_at
            ? this.callFactory(this._created_at, index)
            : undefined,
          updated_at: this._updated_at
            ? this.callFactory(this._updated_at, index)
            : undefined,
          deleted_at: this._deleted_at
            ? this.callFactory(this._deleted_at, index)
            : undefined
        })
      })

    return this.countsObjs === 1
      ? (categories[0] as TBuild)
      : (categories as TBuild)
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private getValue(prop: string) {
    const optional = ['id', 'created_at', 'updated_at', 'deleted_at', 'slug']
    const privateProp = `_${prop}` as keyof this
    if (!this[privateProp] && !optional.includes(prop)) {
      throw new Error(
        `Property ${prop} does not have a factory, use 'with' methods`
      )
    }
    return this.callFactory(this[privateProp] as PropertyOrFactory<any>, 0)
  }

  private callFactory<T>(
    factoryOrValue: PropertyOrFactory<T>,
    index: number
  ): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue
  }

  // ============================================================
  // WITH METHODS - Fluent API
  // ============================================================

  withId(id: PropertyOrFactory<LeadCategoryId>): this {
    this._id = id
    return this
  }

  withName(name: PropertyOrFactory<string>): this {
    this._name = name
    return this
  }

  withSlug(slug: PropertyOrFactory<string>): this {
    this._slug = slug
    return this
  }

  withDescription(description: PropertyOrFactory<string | undefined>): this {
    this._description = description
    return this
  }

  withPriority(priority: PropertyOrFactory<number>): this {
    this._priority = priority
    return this
  }

  withScoreBonus(scoreBonus: PropertyOrFactory<number>): this {
    this._scoreBonus = scoreBonus
    return this
  }

  withKeywords(keywords: PropertyOrFactory<string[]>): this {
    this._keywords = keywords
    return this
  }

  withColor(color: PropertyOrFactory<string>): this {
    this._color = color
    return this
  }

  withIsActive(isActive: PropertyOrFactory<boolean>): this {
    this._is_active = isActive
    return this
  }

  withIsDeleted(isDeleted: PropertyOrFactory<boolean>): this {
    this._is_deleted = isDeleted
    return this
  }

  withIsBlocked(isBlocked: PropertyOrFactory<boolean>): this {
    this._is_blocked = isBlocked
    return this
  }

  withCreatedAt(createdAt: PropertyOrFactory<Date>): this {
    this._created_at = createdAt
    return this
  }

  withUpdatedAt(updatedAt: PropertyOrFactory<Date>): this {
    this._updated_at = updatedAt
    return this
  }

  withDeletedAt(deletedAt: PropertyOrFactory<Date>): this {
    this._deleted_at = deletedAt
    return this
  }

  // ============================================================
  // CONVENIENCE METHODS
  // ============================================================

  active(): this {
    this._is_active = true
    return this
  }

  inactive(): this {
    this._is_active = false
    return this
  }

  deleted(): this {
    this._is_deleted = true
    this._deleted_at = () => new Date()
    return this
  }

  blocked(): this {
    this._is_blocked = true
    return this
  }

  highPriority(): this {
    this._priority = 5
    return this
  }

  lowPriority(): this {
    this._priority = 1
    return this
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get id() {
    return this.getValue('id')
  }

  get name() {
    return this.getValue('name')
  }

  get slug() {
    return this.getValue('slug')
  }

  get description() {
    return this.getValue('description')
  }

  get priority() {
    return this.getValue('priority')
  }

  get scoreBonus() {
    return this.getValue('scoreBonus')
  }

  get keywords() {
    return this.getValue('keywords')
  }

  get color() {
    return this.getValue('color')
  }
}
