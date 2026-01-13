import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { ICacheRepository } from '@modules/core/domain/repositories'
import { LocationModel } from '@modules/lead/domain/models'
import { ILocationRepository } from '@modules/lead/domain/repositories'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'

@Injectable()
export class SearchLocationUseCase {
  private readonly CACHE_PREFIX = 'location:search:'
  private readonly CACHE_TTL = 3600 // 1 hour

  @Inject('ILocationRepository')
  private readonly locationRepository: ILocationRepository

  @Inject('ICacheRepository')
  private readonly cacheRepository: ICacheRepository

  async execute(query: string): Promise<ModelCollectionOutput<LocationModel>> {
    try {
      const normalizedQuery = query.toLowerCase().trim()
      const cacheKey = `${this.CACHE_PREFIX}${normalizedQuery}`

      const cachedData = await this.cacheRepository.get(cacheKey)
      if (cachedData) {
        return new ModelCollectionOutput<LocationModel>({
          data: JSON.parse(cachedData),
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      const locations = await this.locationRepository.searchByName(query)

      await this.cacheRepository.set(
        cacheKey,
        JSON.stringify(locations),
        this.CACHE_TTL
      )

      return new ModelCollectionOutput<LocationModel>({
        data: locations,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelCollectionOutput<LocationModel>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
