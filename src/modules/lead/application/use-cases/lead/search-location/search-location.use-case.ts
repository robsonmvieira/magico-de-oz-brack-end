import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { LocationModel } from '@modules/lead/domain/models'
import { ILocationRepository } from '@modules/lead/domain/repositories'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'

@Injectable()
export class SearchLocationUseCase {
  @Inject('ILocationRepository')
  private readonly locationRepository: ILocationRepository

  async execute(query: string): Promise<ModelCollectionOutput<LocationModel>> {
    try {
      const locations = await this.locationRepository.searchByName(query)
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
