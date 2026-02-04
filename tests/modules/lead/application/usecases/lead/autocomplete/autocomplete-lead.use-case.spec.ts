import { AutocompleteLeadUseCase } from '@modules/lead/application/use-cases/lead/autocomplete/autocomplete-lead.use-case'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import { HttpStatus } from '@nestjs/common'
import { GoogleMapsAutoCompleteResponse } from '@modules/lead/domain/services/googlemaps/types'

const createMockGoogleMapsProvider = (): jest.Mocked<IGoogleMapsProvider> => ({
  search: jest.fn(),
  getReviews: jest.fn(),
  autoComplete: jest.fn()
})

const createMockSuggestion = (text: string, placeId: string = 'ChIJ123') => ({
  placePrediction: {
    place: `places/${placeId}`,
    placeId,
    text: { text },
    structuredFormat: {
      mainText: { text: text.split(',')[0] },
      secondaryText: { text: text.split(',').slice(1).join(',').trim() || '' }
    },
    types: ['establishment']
  }
})

const createMockAutoCompleteResponse = (
  overrides: Partial<GoogleMapsAutoCompleteResponse> = {}
): GoogleMapsAutoCompleteResponse => ({
  suggestions: [
    createMockSuggestion('restaurantes italianos, São Paulo - SP, Brasil'),
    createMockSuggestion('restaurantes japoneses, São Paulo - SP, Brasil'),
    createMockSuggestion('restaurantes mexicanos, São Paulo - SP, Brasil'),
    createMockSuggestion('restaurantes brasileiros, São Paulo - SP, Brasil')
  ],
  ...overrides
})

describe('AutocompleteLeadUseCase', () => {
  let useCase: AutocompleteLeadUseCase
  let googleMapsProvider: jest.Mocked<IGoogleMapsProvider>

  beforeEach(() => {
    googleMapsProvider = createMockGoogleMapsProvider()

    useCase = new AutocompleteLeadUseCase()
    ;(useCase as any).googleMapsProvider = googleMapsProvider
  })

  describe('execute', () => {
    it('should return success with suggestions when autocomplete completes', async () => {
      googleMapsProvider.autoComplete.mockResolvedValue(
        createMockAutoCompleteResponse()
      )

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data).toHaveLength(4)
    })

    it('should call google maps provider with correct parameters', async () => {
      googleMapsProvider.autoComplete.mockResolvedValue(
        createMockAutoCompleteResponse()
      )

      await useCase.execute('padarias', 'BR', 'São Paulo')

      expect(googleMapsProvider.autoComplete).toHaveBeenCalledWith(
        'padarias',
        'BR',
        'São Paulo'
      )
      expect(googleMapsProvider.autoComplete).toHaveBeenCalledTimes(1)
    })

    it('should return mapped suggestions with placeId, name and address', async () => {
      googleMapsProvider.autoComplete.mockResolvedValue(
        createMockAutoCompleteResponse()
      )

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.data[0]).toEqual({
        placeId: 'ChIJ123',
        name: 'restaurantes italianos',
        address: 'São Paulo - SP, Brasil'
      })
      expect(result.data[1]).toEqual({
        placeId: 'ChIJ123',
        name: 'restaurantes japoneses',
        address: 'São Paulo - SP, Brasil'
      })
      expect(result.data[2]).toEqual({
        placeId: 'ChIJ123',
        name: 'restaurantes mexicanos',
        address: 'São Paulo - SP, Brasil'
      })
      expect(result.data[3]).toEqual({
        placeId: 'ChIJ123',
        name: 'restaurantes brasileiros',
        address: 'São Paulo - SP, Brasil'
      })
    })

    it('should handle empty suggestions', async () => {
      googleMapsProvider.autoComplete.mockResolvedValue(
        createMockAutoCompleteResponse({ suggestions: [] })
      )

      const result = await useCase.execute('xyznonexistent', 'BR', 'São Paulo')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.data).toHaveLength(0)
    })

    it('should return error when google maps provider throws', async () => {
      googleMapsProvider.autoComplete.mockRejectedValue(
        new Error('Error getting Google Maps autocomplete: Network error')
      )

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toContain(
        'Error getting Google Maps autocomplete: Network error'
      )
    })

    it('should return error when API key is invalid', async () => {
      googleMapsProvider.autoComplete.mockRejectedValue(
        new Error('Error getting Google Maps autocomplete: Invalid API key')
      )

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toContain('Invalid API key')
    })

    it('should return error when rate limit is exceeded', async () => {
      googleMapsProvider.autoComplete.mockRejectedValue(
        new Error('Error getting Google Maps autocomplete: Rate limit exceeded')
      )

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message[0]).toContain('Rate limit exceeded')
    })

    it('should handle unknown errors gracefully', async () => {
      googleMapsProvider.autoComplete.mockRejectedValue(new Error())

      const result = await useCase.execute('restaurantes', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toBe('Internal server error')
    })

    it('should work with different country and location parameters', async () => {
      googleMapsProvider.autoComplete.mockResolvedValue(
        createMockAutoCompleteResponse()
      )

      await useCase.execute('dentists', 'US', 'New York')

      expect(googleMapsProvider.autoComplete).toHaveBeenCalledWith(
        'dentists',
        'US',
        'New York'
      )
    })

    it('should handle partial query terms', async () => {
      const partialResponse = createMockAutoCompleteResponse({
        suggestions: [
          createMockSuggestion('dentistas, São Paulo - SP, Brasil'),
          createMockSuggestion('dentistas 24 horas, São Paulo - SP, Brasil'),
          createMockSuggestion('dentistas infantil, São Paulo - SP, Brasil')
        ]
      })
      googleMapsProvider.autoComplete.mockResolvedValue(partialResponse)

      const result = await useCase.execute('dentis', 'BR', 'São Paulo')

      expect(result.ok).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data[0].name).toBe('dentistas')
    })
  })
})
