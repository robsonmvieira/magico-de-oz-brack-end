import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import {
  GoogleMapsPlaceResponse,
  GoogleMapsPlaceReviewResponse
} from '@modules/lead/domain/services/googlemaps/types'
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
    location: string
  ): Promise<GoogleMapsPlaceResponse> {
    const data = JSON.stringify({
      q: query,
      hl: location
    })
    const url = '/maps'
    return await this.axiosInstance
      .post(url, data)
      .then(response => response.data)
      .catch(error => {
        throw new Error(`Error searching Google Maps: ${error.message}`)
      })
  }

  async getReviews(
    placeId: string,
    language: string
  ): Promise<GoogleMapsPlaceReviewResponse> {
    const data = JSON.stringify({
      cid: placeId,
      hl: language
    })
    const url = '/reviews'
    return await this.axiosInstance
      .post(url, data)
      .then(response => response.data)
      .catch(error => {
        throw new Error(`Error getting Google Maps reviews: ${error.message}`)
      })
  }
}
