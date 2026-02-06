import { eq, and, or, ilike, sql, asc, desc, SQL } from 'drizzle-orm'
import { PgTable, PgColumn } from 'drizzle-orm/pg-core'
import {
  IRepository,
  PaginatedResult,
  PaginationParams
} from '@modules/core/domain/repositories'
import { DrizzleDB, DrizzleClient } from '@modules/database'

type TableWithId = PgTable & { id: any; isDeleted: any; createdAt?: any }

export abstract class DrizzleRepository<
  TTable extends TableWithId,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert']
> implements IRepository<TSelect, TInsert> {
  constructor(
    protected readonly db: DrizzleDB,
    protected readonly table: TTable
  ) {}

  protected getDb(tx?: DrizzleClient): DrizzleClient {
    return tx ?? this.db
  }

  protected getSearchableColumns(): PgColumn[] {
    return []
  }

  async save(entity: TInsert, tx?: DrizzleClient): Promise<void> {
    await this.getDb(tx)
      .insert(this.table)
      .values(entity as any)
  }

  async update(
    modelId: string,
    entity: Partial<TInsert>,
    tx?: DrizzleClient
  ): Promise<void> {
    await this.getDb(tx)
      .update(this.table)
      .set(entity as any)
      .where(eq(this.table.id, modelId))
  }

  async delete(entity: TSelect, tx?: DrizzleClient): Promise<void> {
    await this.getDb(tx)
      .update(this.table)
      .set({ isDeleted: true } as any)
      .where(eq(this.table.id, (entity as any).id))
  }

  async findById(id: string, tx?: DrizzleClient): Promise<TSelect | null> {
    const result = await this.getDb(tx)
      .select()
      .from(this.table as any)
      .where(eq(this.table.id, id))
      .limit(1)

    return (result[0] as TSelect) || null
  }

  async findAll(tx?: DrizzleClient): Promise<TSelect[]> {
    const result = await this.getDb(tx)
      .select()
      .from(this.table as any)
      .where(eq(this.table.isDeleted, false))

    return result as TSelect[]
  }

  async findAllPaginated(
    params: PaginationParams,
    tx?: DrizzleClient
  ): Promise<PaginatedResult<TSelect>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', search } = params
    const offset = (page - 1) * limit

    const conditions: SQL[] = [eq(this.table.isDeleted, false)]

    if (search) {
      const searchableColumns = this.getSearchableColumns()
      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns.map(column =>
          ilike(column, `%${search}%`)
        )
        const searchOr = or(...searchConditions)
        if (searchOr) {
          conditions.push(searchOr)
        }
      }
    }

    const whereClause = and(...conditions)

    let orderByClause: SQL | undefined
    if (sortBy && sortBy in this.table) {
      const column = (this.table as any)[sortBy] as PgColumn
      orderByClause = sortOrder === 'asc' ? asc(column) : desc(column)
    } else if (this.table.createdAt) {
      orderByClause =
        sortOrder === 'asc'
          ? asc(this.table.createdAt)
          : desc(this.table.createdAt)
    }

    const [data, countResult] = await Promise.all([
      this.getDb(tx)
        .select()
        .from(this.table as any)
        .where(whereClause)
        .orderBy(orderByClause ?? sql`1`)
        .limit(limit)
        .offset(offset),
      this.getDb(tx)
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table as any)
        .where(whereClause)
    ])

    return {
      data: data as TSelect[],
      totalItems: countResult[0]?.count ?? 0,
      page,
      limit
    }
  }

  async count(tx?: DrizzleClient): Promise<number> {
    const result = await this.getDb(tx)
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table as any)
      .where(eq(this.table.isDeleted, false))

    return result[0]?.count ?? 0
  }
}
