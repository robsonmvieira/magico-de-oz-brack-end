import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'

export type AutocompleteLeadOutput = {
  placeId: string
  name: string
  address: string
}

@Injectable()
export class AutocompleteLeadUseCase {
  @Inject('IGoogleMapsProvider')
  private readonly googleMapsProvider: IGoogleMapsProvider

  async execute(
    query: string,
    country: string,
    location: string
  ): Promise<ModelCollectionOutput<AutocompleteLeadOutput>> {
    try {
      const autocompleteData = await this.googleMapsProvider.autoComplete(
        query,
        country,
        location
      )

      const suggestions: AutocompleteLeadOutput[] =
        autocompleteData.suggestions?.map(suggestion => ({
          placeId: suggestion.placePrediction.placeId,
          name: suggestion.placePrediction.structuredFormat.mainText.text,
          address:
            suggestion.placePrediction.structuredFormat.secondaryText.text
        })) ?? []

      return new ModelCollectionOutput<AutocompleteLeadOutput>({
        data: suggestions,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelCollectionOutput<AutocompleteLeadOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
