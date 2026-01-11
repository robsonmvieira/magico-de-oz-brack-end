import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB } from '@modules/database'
import { ILocationRepository } from '@modules/lead/domain/repositories'
import {
  LocationSchema,
  LocationModel
} from '@modules/lead/domain/models/location.model'

@Injectable()
export class LocationRepository
  extends DrizzleRepository<typeof LocationSchema>
  implements ILocationRepository
{
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, LocationSchema)
  }

  async findByGoogleId(googleId: number): Promise<LocationModel | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.googleId, googleId))
      .limit(1)

    return result[0] || null
  }

  async findByCountryCode(countryCode: string): Promise<LocationModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.countryCode, countryCode))

    return result
  }

  async findByTargetType(targetType: string): Promise<LocationModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.targetType, targetType))

    return result
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id)
    return result !== null
  }

  async existsByGoogleId(googleId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.googleId, googleId))
      .limit(1)

    return result.length > 0
  }
}
