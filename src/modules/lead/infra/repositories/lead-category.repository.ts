import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB, DrizzleClient } from '@modules/database'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import {
  LeadCategorySchema,
  LeadCategoryModel,
  NewLeadCategoryModel
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
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')

    // Extrai palavras relevantes do texto (mínimo 3 caracteres)
    const words = normalize(text)
      .split(/[\s|,]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 3)

    if (!words.length) {
      return []
    }

    // Busca categorias ativas
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isActive, true))

    // Filtra categorias que têm match com alguma palavra do texto
    // Considera tanto keywords quanto o nome da categoria
    return result.filter(category => {
      const searchableText = normalize(`${category.keywords},${category.name}`)
      return words.some(word => searchableText.includes(word))
    })
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

  async upsert(
    entity: NewLeadCategoryModel,
    tx?: DrizzleClient
  ): Promise<void> {
    await this.getDb(tx)
      .insert(this.table)
      .values(entity as any)
      .onConflictDoNothing({ target: this.table.id })
  }
}
