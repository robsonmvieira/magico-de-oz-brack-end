import {
  LeadCategoryModel,
  NewLeadCategoryModel
} from '@modules/lead/domain/models/lead-category.model'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import {
  PaginatedResult,
  PaginationParams
} from '@modules/core/domain/repositories'
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

  async findAllPaginated(
    params: PaginationParams
  ): Promise<PaginatedResult<LeadCategoryModel>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', search } = params
    const offset = (page - 1) * limit

    let filteredItems = this.items.filter(item => !item.isDeleted)

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredItems = filteredItems.filter(
        item =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    if (sortBy && filteredItems.length > 0 && sortBy in filteredItems[0]) {
      filteredItems.sort((a, b) => {
        const aVal = (a as any)[sortBy]
        const bVal = (b as any)[sortBy]
        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        const comparison = aVal < bVal ? -1 : 1
        return sortOrder === 'asc' ? comparison : -comparison
      })
    } else {
      // Default sort by createdAt desc
      filteredItems.sort((a, b) => {
        const comparison =
          (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    const totalItems = filteredItems.length
    const data = filteredItems.slice(offset, offset + limit)

    return {
      data,
      totalItems,
      page,
      limit
    }
  }

  async count(): Promise<number> {
    return this.items.filter(item => !item.isDeleted).length
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

  async upsert(entity: NewLeadCategoryModel): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === entity.id)
    if (existingIndex === -1) {
      await this.save(entity)
    }
  }

  clear(): void {
    this.items = []
  }

  getItems(): LeadCategoryModel[] {
    return [...this.items]
  }
}
