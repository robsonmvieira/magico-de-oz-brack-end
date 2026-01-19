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

export type IALeadCategoryClassifierOutput = {
  created_at: string
  has_error: boolean
  error: null | string
  error_message: null | string
  data: {
    lead_category: {
      id: string
      name: string
      slug: string
      description: string
      error: null
      error_message: null
      data: {
        lead_category: {
          id: string
          name: string
          slug: string
          description: string
          priority: number
          score_bonus: number
          keywords: string[]
          color: string
        }
        is_new_category: boolean
        confidence_score: number
        classification_metadata: {
          primary_type: string
          place_types: string[]
          display_name: string
          reasoning: string
        }
      }
      success: boolean
      StatusCode: number
    }
    is_new_category: boolean
    classification_metadata: {
      primary_type?: string
      place_types?: string[]
      display_name?: string
      reasoning?: string
    }
  }
}

@Injectable()
export class IAClassifierCategory implements ICategoryClassifierDomainService<IALeadCategoryClassifierOutput> {
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
}
