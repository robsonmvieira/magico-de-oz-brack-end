import { SearchLeadUseCase } from '@modules/lead/application/use-cases/lead/search/search-lead.use-case'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import { HttpStatus } from '@nestjs/common'
import {
  GoogleMapsPlaceResponse,
  GoogleMapsPlaceReviewResponse
} from '@modules/lead/domain/services/googlemaps/types'

const createMockGoogleMapsProvider = (): jest.Mocked<IGoogleMapsProvider> => ({
  search: jest.fn(),
  getReviews: jest.fn()
})

const createMockSearchResponse = (
  overrides: Partial<GoogleMapsPlaceResponse> = {}
): GoogleMapsPlaceResponse => ({
  searchParameters: {
    q: 'restaurants',
    hl: 'pt-BR',
    type: 'maps',
    num: 10,
    page: 1,
    engine: 'google_maps'
  },
  ll: '-23.55,-46.63',
  places: [
    {
      position: 1,
      title: 'Restaurant ABC',
      address: 'Rua Test, 123, São Paulo',
      latitude: -23.55,
      longitude: -46.63,
      rating: 4.5,
      ratingCount: 100,
      priceLevel: '$$',
      type: 'Restaurant',
      types: ['restaurant', 'food']
    },
    {
      position: 2,
      title: 'Restaurant XYZ',
      address: 'Av. Paulista, 456, São Paulo',
      latitude: -23.56,
      longitude: -46.64,
      rating: 4.2,
      ratingCount: 50,
      priceLevel: '$',
      type: 'Restaurant',
      types: ['restaurant']
    }
  ],
  credits: 1,
  ...overrides
})

describe('SearchLeadUseCase', () => {
  let useCase: SearchLeadUseCase
  let googleMapsProvider: jest.Mocked<IGoogleMapsProvider>

  beforeEach(() => {
    googleMapsProvider = createMockGoogleMapsProvider()
    useCase = new SearchLeadUseCase()
    ;(useCase as any).googleMapsProvider = googleMapsProvider
  })

  describe('execute', () => {
    it('should return success when search completes', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())

      const result = await useCase.execute('restaurants', 'pt-BR')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should call google maps provider with correct parameters', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())

      await useCase.execute('padarias', 'pt-BR')

      expect(googleMapsProvider.search).toHaveBeenCalledWith(
        'padarias',
        'pt-BR'
      )
      expect(googleMapsProvider.search).toHaveBeenCalledTimes(1)
    })

    it('should handle empty search results', async () => {
      googleMapsProvider.search.mockResolvedValue(
        createMockSearchResponse({ places: [] })
      )

      const result = await useCase.execute('xyznonexistent', 'pt-BR')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should return error when google maps provider throws', async () => {
      googleMapsProvider.search.mockRejectedValue(
        new Error('Error searching Google Maps: Network error')
      )

      const result = await useCase.execute('restaurants', 'pt-BR')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toContain(
        'Error searching Google Maps: Network error'
      )
    })

    it('should return error when API key is invalid', async () => {
      googleMapsProvider.search.mockRejectedValue(
        new Error('Error searching Google Maps: Invalid API key')
      )

      const result = await useCase.execute('restaurants', 'pt-BR')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toContain('Invalid API key')
    })

    it('should return error when rate limit is exceeded', async () => {
      googleMapsProvider.search.mockRejectedValue(
        new Error('Error searching Google Maps: Rate limit exceeded')
      )

      const result = await useCase.execute('restaurants', 'pt-BR')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message[0]).toContain('Rate limit exceeded')
    })

    it('should handle unknown errors gracefully', async () => {
      googleMapsProvider.search.mockRejectedValue(new Error())

      const result = await useCase.execute('restaurants', 'pt-BR')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should search with different location parameters', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())

      await useCase.execute('dentistas', 'en-US')

      expect(googleMapsProvider.search).toHaveBeenCalledWith(
        'dentistas',
        'en-US'
      )
    })
  })
})
