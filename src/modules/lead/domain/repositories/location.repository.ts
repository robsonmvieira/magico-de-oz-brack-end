import { LocationModel, NewLocationModel } from '../models/location.model'

export interface ILocationRepository {
  save(entity: NewLocationModel): Promise<void>
  update(modelId: number, entity: Partial<NewLocationModel>): Promise<void>
  delete(entity: LocationModel): Promise<void>
  findById(id: number): Promise<LocationModel | null>
  findAll(): Promise<LocationModel[]>
  findByGoogleId(googleId: number): Promise<LocationModel | null>
  findByCountryCode(countryCode: string): Promise<LocationModel[]>
  findByTargetType(targetType: string): Promise<LocationModel[]>
  exists(id: number): Promise<boolean>
  existsByGoogleId(googleId: number): Promise<boolean>
}
