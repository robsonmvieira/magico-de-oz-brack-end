import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
export type IALeadCategoryClassifierInput = {
  place_data: {
    primaryType: string
    types: string[]
    displayName: {
      text: string
    }
    primaryTypeDisplayName: {
      text: string
    }
    editorialSummary: {
      text: string
    }
    priceLevel: string
    servesBeer: boolean
    servesWine: boolean
    servesCocktails: boolean
    servesBreakfast: boolean
    servesLunch: boolean
    servesDinner: boolean
  }
  allow_new_categories: boolean
}

export type IALeadCategoryClassifierPlace = {
  id: string
  name: string
  displayName: {
    text: string
  }
  internationalPhoneNumber?: string
  websiteUri?: string
  formattedAddress: string
  location: {
    latitude: number
    longitude: number
  }
  addressComponents?: unknown[]
}

export type IALeadCategory = {
  id: string
  name: string
  slug: string
  description: string
  priority: number
  score_bonus: number
  keywords: string[]
  color: string
}

export type IAClassificationResult = {
  lead_category: IALeadCategory
  is_new_category: boolean
  confidence_score: number
  place: IALeadCategoryClassifierPlace
}

export type IALeadCategoryClassifierOutput = {
  created_at: string
  has_error: boolean
  error: null | string
  error_message: null | string
  data: IAClassificationResult
  success: boolean
  StatusCode: number
}

export type IALeadCategoryClassifierBatchOutput = {
  created_at: string
  has_error: boolean
  error: null | string
  error_message: null | string
  data: {
    results: IAClassificationResult[]
    statistics: {
      total: number
      successful: number
      failed: number
    }
  }
  success: boolean
  StatusCode: number
}

@Injectable()
export class IAClassifierCategory implements ICategoryClassifierDomainService<
  IALeadCategoryClassifierOutput,
  IAClassificationResult
> {
  private readonly axiosInstance: AxiosInstance

  constructor(private readonly configService: ConfigService) {
    let baseURL = this.configService.get('AGENT_MICROSERVICE_BASE_URL')
    if (baseURL && !baseURL.endsWith('/')) {
      baseURL = `${baseURL}/`
    }
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        Host: 'localhost'
      }
    })
  }

  async findBestMatch(
    content: IALeadCategoryClassifierInput
  ): Promise<IALeadCategoryClassifierOutput> {
    const url = 'lead-categories/classify'
    const fullUrl = `${this.axiosInstance.defaults.baseURL}${url}`

    const response = await this.axiosInstance
      .post<IALeadCategoryClassifierOutput>(url, content)
      .then(response => {
        console.log('response => ', response.data)
        return response
      })
      .catch(error => {
        console.error('Request URL:', fullUrl)
        console.error(
          'Error details:',
          error.response?.status,
          error.response?.data
        )
        throw new Error(`Error classifying lead category: ${error.message}`)
      })
    return response.data
  }

  async classifyChunk(content: any[]): Promise<IAClassificationResult[]> {
    const url = 'lead-categories/classify-batch'
    const fullUrl = `${this.axiosInstance.defaults.baseURL}${url}`

    const payload = {
      places: content
    }

    const response = await this.axiosInstance
      .post<IALeadCategoryClassifierBatchOutput>(url, payload)
      .then(response => {
        return response.data.data.results
      })
      .catch(error => {
        console.error('Request URL:', fullUrl)
        console.error(
          'Error details:',
          error.response?.status,
          error.response?.data
        )
        throw new Error(`Error classifying lead category: ${error.message}`)
      })
    return response
  }
}
