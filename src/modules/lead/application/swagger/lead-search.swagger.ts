import { HttpStatus } from '@nestjs/common'
import {
  ApiOperationOptions,
  ApiQueryOptions,
  ApiResponseOptions
} from '@nestjs/swagger'

export const SearchLeadSwagger = {
  operation: {
    summary: 'Search leads on Google Maps',
    description:
      'Searches for businesses on Google Maps based on query and location'
  } as ApiOperationOptions,

  queries: {
    query: {
      name: 'query',
      description: 'Search query (e.g., "restaurants", "dentists")',
      type: 'string',
      required: true
    } as ApiQueryOptions,

    location: {
      name: 'location',
      description: 'Location to search in (e.g., "São Paulo, SP")',
      type: 'string',
      required: true
    } as ApiQueryOptions
  },

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Search results retrieved successfully'
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid search parameters'
    } as ApiResponseOptions,

    internalError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Error while searching Google Maps'
    } as ApiResponseOptions
  }
}

export const SearchLocationSwagger = {
  operation: {
    summary: 'Search locations by query',
    description:
      'Searches for geographic locations (cities, neighborhoods, regions) by name. Returns a list of matching locations with their Google IDs for use in lead searches.'
  } as ApiOperationOptions,

  queries: {
    query: {
      name: 'query',
      description:
        'Location search term (e.g., "São Paulo", "Pinheiros", "Rio de Janeiro")',
      type: 'string',
      required: true,
      example: 'São Paulo'
    } as ApiQueryOptions
  },

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Locations retrieved successfully'
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid search parameters'
    } as ApiResponseOptions
  }
}

export const AutocompleteSwagger = {
  operation: {
    summary: 'Autocomplete search suggestions',
    description:
      'Returns autocomplete suggestions for lead searches based on query, country and location. Useful for implementing search-as-you-type functionality in the frontend.'
  } as ApiOperationOptions,

  queries: {
    query: {
      name: 'query',
      description:
        'Partial search term to get suggestions for (e.g., "restaur", "dentis")',
      type: 'string',
      required: true,
      example: 'restaurantes'
    } as ApiQueryOptions,

    country: {
      name: 'country',
      description: 'Country code for search context (e.g., "br" for Brazil)',
      type: 'string',
      required: true,
      example: 'br'
    } as ApiQueryOptions,

    location: {
      name: 'location',
      description:
        'Location context for suggestions (e.g., "São Paulo, SP", "Rio de Janeiro, RJ")',
      type: 'string',
      required: true,
      example: 'São Paulo, SP'
    } as ApiQueryOptions
  },

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Autocomplete suggestions retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                  example: 'restaurantes italianos'
                }
              }
            }
          },
          hasError: { type: 'boolean', example: false },
          error: { type: 'object', nullable: true },
          statusCode: { type: 'number', example: 200 }
        }
      }
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid search parameters'
    } as ApiResponseOptions,

    internalError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Error while fetching autocomplete suggestions'
    } as ApiResponseOptions
  }
}
