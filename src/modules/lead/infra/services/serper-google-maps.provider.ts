import {
  IGoogleMapsProvider,
  GooglePlaceResponse,
  GoogleMapsPlaceReviewResponse,
  GoogleMapsAutoCompleteResponse
} from '@modules/lead/domain/services/googlemaps'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SerperGoogleMapsProvider implements IGoogleMapsProvider {
  private readonly axiosInstance: AxiosInstance
  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: 'https://google.serper.dev',
      headers: {
        'X-API-KEY': this.configService.get('SERPER_API_KEY'),
        'Content-Type': 'application/json'
      }
    })
  }
  async search(
    query: string,
    country: string,
    location: string
  ): Promise<GooglePlaceResponse> {
    const data = JSON.stringify({
      q: query,
      gl: country,
      location,
      hl: 'pt-br'
    })
    const url = '/places'
    return await this.axiosInstance
      .post(url, data)
      .then(response => response.data)
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
