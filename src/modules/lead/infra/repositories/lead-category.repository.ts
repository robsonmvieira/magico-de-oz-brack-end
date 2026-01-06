import { Inject, Injectable } from '@nestjs/common'
import { eq, ilike as ILikeOperator } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB } from '@modules/database'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import {
  LeadCategorySchema,
  LeadCategoryModel
} from '@modules/lead/domain/models/lead-category.model'

@Injectable()
export class LeadCategoryRepository
  extends DrizzleRepository<typeof LeadCategorySchema>
  implements ILeadCategoryRepository
{
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, LeadCategorySchema)
  }

  async findByKeywordMatch(text: string): Promise<LeadCategoryModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(ILikeOperator(this.table.keywords, `%${text}%`))

    return result
  }

  async findActive(): Promise<LeadCategoryModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isActive, true))

    return result
  }

  async findBySlug(slug: string): Promise<LeadCategoryModel | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.slug, slug))
      .limit(1)

    return result[0] || null
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id)
    return result !== null
  }

  async existsByName(name: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.name, name))
      .limit(1)

    return result.length > 0
  }
}
