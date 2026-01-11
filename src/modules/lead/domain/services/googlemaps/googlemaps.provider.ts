import { GoogleMapsPlaceResponse, GoogleMapsPlaceReviewResponse } from './types'

export interface IGoogleMapsProvider {
  search(query: string, location: string): Promise<GoogleMapsPlaceResponse>
  getReviews(
    placeId: string,
    language: string
  ): Promise<GoogleMapsPlaceReviewResponse>
}
