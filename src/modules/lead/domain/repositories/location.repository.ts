import { LocationModel, NewLocationModel } from '../models/location.model'
import { IRepository } from '@modules/core/domain/repositories'

export interface ILocationRepository extends IRepository<
  LocationModel,
  NewLocationModel
> {
  findByGoogleId(googleId: number): Promise<LocationModel | null>
  findByCountryCode(countryCode: string): Promise<LocationModel[]>
  findByTargetType(targetType: string): Promise<LocationModel[]>
  exists(id: string): Promise<boolean>
  existsByGoogleId(googleId: number): Promise<boolean>
}
