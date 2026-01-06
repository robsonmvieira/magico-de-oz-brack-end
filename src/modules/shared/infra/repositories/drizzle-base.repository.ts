import { eq } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { IRepository } from '@modules/core/domain/repositories'
import { DrizzleDB } from '@modules/database'

type TableWithId = PgTable & { id: any; isDeleted: any }

export abstract class DrizzleRepository<
  TTable extends TableWithId,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert']
> implements IRepository<TSelect, TInsert> {
  constructor(
    protected readonly db: DrizzleDB,
    protected readonly table: TTable
  ) {}

  async save(entity: TInsert): Promise<void> {
    await this.db.insert(this.table).values(entity as any)
  }

  async update(modelId: string, entity: Partial<TInsert>): Promise<void> {
    await this.db
      .update(this.table)
      .set(entity as any)
      .where(eq(this.table.id, modelId))
  }

  async delete(entity: TSelect): Promise<void> {
    await this.db
      .update(this.table)
      .set({ isDeleted: true } as any)
      .where(eq(this.table.id, (entity as any).id))
  }

  async findById(id: string): Promise<TSelect | null> {
    const result = await this.db
      .select()
      .from(this.table as any)
      .where(eq(this.table.id, id))
      .limit(1)

    return (result[0] as TSelect) || null
  }

  async findAll(): Promise<TSelect[]> {
    const result = await this.db
      .select()
      .from(this.table as any)
      .where(eq(this.table.isDeleted, false))

    return result as TSelect[]
  }
}
