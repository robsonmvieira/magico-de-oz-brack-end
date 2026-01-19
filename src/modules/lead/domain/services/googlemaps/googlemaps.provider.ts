import {
  GoogleMapsAutoCompleteResponse,
  GooglePlaceResponse,
  GoogleMapsPlaceReviewResponse
} from './types'

export interface IGoogleMapsProvider {
  search(
    query: string,
    country: string,
    location: string
  ): Promise<GooglePlaceResponse>
  getReviews(
    placeId: string,
    country: string
  ): Promise<GoogleMapsPlaceReviewResponse>

  autoComplete(
    query: string,
    country: string,
    location: string
  ): Promise<GoogleMapsAutoCompleteResponse>
}
