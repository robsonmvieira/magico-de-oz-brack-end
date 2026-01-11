import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import { HttpStatus, Inject } from '@nestjs/common'
import { LeadOutput } from '../list'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'

export class SearchLeadUseCase {
  @Inject('IGoogleMapsProvider')
  private readonly googleMapsProvider: IGoogleMapsProvider
  async execute(
    query: string,
    location: string
  ): Promise<ModelCollectionOutput<LeadOutput>> {
    try {
      const googleMapsData = await this.googleMapsProvider.search(
        query,
        location
      )

      console.log('query => ', query)
      console.log('location => ', location)
      console.log('googleMapsData => ', googleMapsData)
      console.log('finished => ')
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      console.log('error => ', error)
      console.log('finished on error => ')
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
