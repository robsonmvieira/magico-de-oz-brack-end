import {
  GoogleMapsAutoCompleteResponse,
  GoogleMapsPlaceResponse,
  GoogleMapsPlaceReviewResponse,
  IGoogleMapsProvider
} from '@modules/lead/domain/services/googlemaps'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class GoogleMapsProvider implements IGoogleMapsProvider {
  private readonly axiosInstance: AxiosInstance
  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: 'https://places.googleapis.com/v1',
      headers: {
        'X-Goog-Api-Key': this.configService.get('GOOGLE_MAPS_API_KEY'),
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.priceLevel',
        'Content-Type': 'application/json'
      }
    })
  }

  async search(
    query: string,
    country: string,
    location: string
  ): Promise<GoogleMapsPlaceResponse> {
    const textQuery = `${query} in ${location}, ${country}`
    return await this.axiosInstance
      .post('/places:searchText', { textQuery })
      .then(response => {
        console.log('response => ', response.data)
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
    const data = JSON.stringify({
      q: query,
      gl: country,
      location,
      hl: 'pt-br'
    })

    return await this.axiosInstance
      .post('/autocomplete', data)
      .then(response => response.data)
      .catch(error => {
        throw new Error(
          `Error getting Google Maps autocomplete: ${error.message}`
        )
      })
  }
}
