import {
  GoogleMapsAutoCompleteResponse,
  GooglePlaceResponse,
  GoogleMapsPlaceReviewResponse,
  IGoogleMapsProvider
} from '@modules/lead/domain/services/googlemaps'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { Injectable } from '@nestjs/common'

const GOOGLE_PLACES_FIELD_MASK = [
  'places.id',
  'places.name',
  'places.types',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.formattedAddress',
  'places.addressComponents',
  'places.plusCode',
  'places.location',
  'places.viewport',
  'places.rating',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.regularOpeningHours',
  'places.utcOffsetMinutes',
  'places.adrFormatAddress',
  'places.businessStatus',
  'places.priceLevel',
  'places.userRatingCount',
  'places.iconMaskBaseUri',
  'places.iconBackgroundColor',
  'places.displayName',
  'places.primaryTypeDisplayName',
  'places.takeout',
  'places.delivery',
  'places.dineIn',
  'places.reservable',
  'places.servesBreakfast',
  'places.servesLunch',
  'places.servesDinner',
  'places.servesBeer',
  'places.servesWine',
  'places.servesVegetarianFood',
  'places.currentOpeningHours',
  'places.primaryType',
  'places.shortFormattedAddress',
  'places.editorialSummary',
  'places.reviews',
  'places.photos',
  'places.outdoorSeating',
  'places.liveMusic',
  'places.menuForChildren',
  'places.servesCocktails',
  'places.servesDessert',
  'places.servesCoffee',
  'places.goodForChildren',
  'places.allowsDogs',
  'places.restroom',
  'places.goodForGroups',
  'places.goodForWatchingSports',
  'places.paymentOptions',
  'places.parkingOptions',
  'places.accessibilityOptions',
  'places.addressDescriptor',
  'places.googleMapsLinks',
  'places.reviewSummary',
  'places.timeZone',
  'places.postalAddress'
].join(',')

@Injectable()
export class GoogleMapsProvider implements IGoogleMapsProvider {
  private readonly axiosInstance: AxiosInstance
  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: 'https://places.googleapis.com/v1',
      headers: {
        'X-Goog-Api-Key': this.configService.get('GOOGLE_MAPS_API_KEY'),
        'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASK,
        'Content-Type': 'application/json'
      }
    })
  }

  async search(
    query: string,
    country: string,
    location: string
  ): Promise<GooglePlaceResponse> {
    const textQuery = `${query}, ${location}- ${country}`
    return await this.axiosInstance
      .post('/places:searchText', {
        textQuery,
        languageCode: 'pt-BR'
      })
      .then(response => {
        return response.data
      })
      .catch(error => {
        throw new Error(`Error searching Google Maps: ${error.message}`)
      })
  }

  async getReviews(
    placeId: string,
    country: string
  ): Promise<GoogleMapsPlaceReviewResponse> {
    const data = JSON.stringify({
      cid: placeId,
      hl: 'pt-br',
      gl: country
    })
    const url = '/reviews'
    return await this.axiosInstance
      .post(url, data)
      .then(response => response.data)
      .catch(error => {
        throw new Error(`Error getting Google Maps reviews: ${error.message}`)
      })
  }
  async autoComplete(
    query: string,
    country: string,
    location: string
  ): Promise<GoogleMapsAutoCompleteResponse> {
    const textQuery = location ? `${query} em ${location}, ${country}` : query

    return await this.axiosInstance
      .post('/places:searchText', {
        textQuery,
        languageCode: 'pt-BR'
      })
      .then(response => {
        const places = response.data.places || []
        return {
          suggestions: places.map(
            (place: {
              id: string
              displayName?: { text: string }
              formattedAddress?: string
            }) => ({
              placePrediction: {
                place: place.id,
                placeId: place.id,
                text: { text: place.displayName?.text || '' },
                structuredFormat: {
                  mainText: { text: place.displayName?.text || '' },
                  secondaryText: { text: place.formattedAddress || '' }
                },
                types: []
              }
            })
          )
        }
      })
      .catch(error => {
        throw new Error(
          `Error getting Google Maps autocomplete: ${error.message}`
        )
      })
  }
}
