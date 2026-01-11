import { Inject, Injectable } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import { DRIZZLE, DrizzleDB } from '@modules/database'
import { ILocationRepository } from '@modules/lead/domain/repositories'
import {
  LocationSchema,
  LocationModel,
  NewLocationModel
} from '@modules/lead/domain/models/location.model'

@Injectable()
export class LocationRepository implements ILocationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async save(entity: NewLocationModel): Promise<void> {
    await this.db.insert(LocationSchema).values(entity)
  }

  async update(
    modelId: number,
    entity: Partial<NewLocationModel>
  ): Promise<void> {
    await this.db
      .update(LocationSchema)
      .set(entity)
      .where(eq(LocationSchema.id, modelId))
  }

  async delete(entity: LocationModel): Promise<void> {
    await this.db
      .update(LocationSchema)
      .set({ isDeleted: true })
      .where(eq(LocationSchema.id, entity.id))
  }

  async findById(id: number): Promise<LocationModel | null> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.id, id))
      .limit(1)

    return result[0] || null
  }

  async findAll(): Promise<LocationModel[]> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.isDeleted, false))

    return result
  }

  async findByGoogleId(googleId: number): Promise<LocationModel | null> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.googleId, googleId))
      .limit(1)

    return result[0] || null
  }

  async findByCountryCode(countryCode: string): Promise<LocationModel[]> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.countryCode, countryCode))

    return result
  }

  async findByTargetType(targetType: string): Promise<LocationModel[]> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.targetType, targetType))

    return result
  }

  async exists(id: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.id, id))
      .limit(1)

    return result.length > 0
  }

  async existsByGoogleId(googleId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(LocationSchema)
      .where(eq(LocationSchema.googleId, googleId))
      .limit(1)

    return result.length > 0
  }

  async searchByName(searchTerm: string, limit = 10): Promise<LocationModel[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM locations
      WHERE name_normalized ILIKE '%' || unaccent(lower(${searchTerm})) || '%'
      ORDER BY similarity(name_normalized, unaccent(lower(${searchTerm}))) DESC
      LIMIT ${limit}
    `)

    return result.rows as LocationModel[]
  }
}
