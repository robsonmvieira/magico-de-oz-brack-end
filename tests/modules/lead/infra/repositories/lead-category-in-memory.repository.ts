import {
  LeadCategoryModel,
  NewLeadCategoryModel
} from '@modules/lead/domain/models/lead-category.model'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { randomUUID } from 'crypto'

export class LeadCategoryInMemoryRepository implements ILeadCategoryRepository {
  private items: LeadCategoryModel[] = []

  async save(entity: NewLeadCategoryModel): Promise<void> {
    const now = new Date()
    const item: LeadCategoryModel = {
      id: entity.id ?? randomUUID(),
      name: entity.name,
      slug: entity.slug,
      description: entity.description ?? null,
      priority: entity.priority,
      score_bonus: entity.score_bonus,
      keywords: entity.keywords,
      color: entity.color,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      isActive: true,
      isBlocked: false
    }
    this.items.push(item)
  }

  async update(
    modelId: string,
    entity: Partial<NewLeadCategoryModel>
  ): Promise<void> {
    const index = this.items.findIndex(item => item.id === modelId)
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        ...entity,
        updatedAt: new Date()
      }
    }
  }

  async delete(entity: LeadCategoryModel): Promise<void> {
    const index = this.items.findIndex(item => item.id === entity.id)
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        isDeleted: true,
        updatedAt: new Date()
      }
    }
  }

  async findById(id: string): Promise<LeadCategoryModel | null> {
    return this.items.find(item => item.id === id) ?? null
  }

  async findAll(): Promise<LeadCategoryModel[]> {
    return this.items.filter(item => !item.isDeleted)
  }

  async findByKeywordMatch(text: string): Promise<LeadCategoryModel[]> {
    const lowerText = text.toLowerCase()
    return this.items.filter(
      item => !item.isDeleted && item.keywords.toLowerCase().includes(lowerText)
    )
  }

  async findActive(): Promise<LeadCategoryModel[]> {
    return this.items.filter(item => !item.isDeleted && item.isActive)
  }

  async findBySlug(slug: string): Promise<LeadCategoryModel | null> {
    return this.items.find(item => item.slug === slug) ?? null
  }

  async exists(id: string): Promise<boolean> {
    return this.items.some(item => item.id === id)
  }

  async existsByName(name: string): Promise<boolean> {
    return this.items.some(item => item.name === name)
  }

  clear(): void {
    this.items = []
  }

  getItems(): LeadCategoryModel[] {
    return [...this.items]
  }
}
