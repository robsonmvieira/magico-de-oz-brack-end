import { GoogleMapsPlaceResponse, GoogleMapsPlaceReviewResponse } from './types'

export interface IGoogleMapsProvider {
  search(
    query: string,
    country: string,
    location: string
  ): Promise<GoogleMapsPlaceResponse>
  getReviews(
    placeId: string,
    country: string
  ): Promise<GoogleMapsPlaceReviewResponse>
}
