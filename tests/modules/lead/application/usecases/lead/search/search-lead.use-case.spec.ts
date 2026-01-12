import { SearchLeadUseCase } from '@modules/lead/application/use-cases/lead/search/search-lead.use-case'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import { HttpStatus } from '@nestjs/common'
import { GoogleMapsPlaceResponse } from '@modules/lead/domain/services/googlemaps/types'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import {
  ILeadCategoryRepository,
  ILocationRepository
} from '@modules/lead/domain/repositories'

const createMockGoogleMapsProvider = (): jest.Mocked<IGoogleMapsProvider> => ({
  search: jest.fn(),
  getReviews: jest.fn()
})

const createMockCategoryClassifier =
  (): jest.Mocked<ICategoryClassifierDomainService> => ({
    findBestMatch: jest.fn()
  })

const createMockLeadCategoryRepository =
  (): jest.Mocked<ILeadCategoryRepository> => ({
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    exists: jest.fn(),
    existsByName: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByKeywordMatch: jest.fn(),
    findActive: jest.fn()
  })

const createMockLocationRepository = (): jest.Mocked<ILocationRepository> => ({
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByGoogleId: jest.fn(),
  findByCountryCode: jest.fn(),
  findByTargetType: jest.fn(),
  exists: jest.fn(),
  existsByGoogleId: jest.fn(),
  searchByName: jest.fn()
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
  let categoryClassifier: jest.Mocked<ICategoryClassifierDomainService>
  let leadCategoryRepository: jest.Mocked<ILeadCategoryRepository>
  let locationRepository: jest.Mocked<ILocationRepository>

  beforeEach(() => {
    googleMapsProvider = createMockGoogleMapsProvider()
    categoryClassifier = createMockCategoryClassifier()
    leadCategoryRepository = createMockLeadCategoryRepository()
    locationRepository = createMockLocationRepository()

    useCase = new SearchLeadUseCase()
    ;(useCase as any).googleMapsProvider = googleMapsProvider
    ;(useCase as any).categoryClassifier = categoryClassifier
    ;(useCase as any).leadCategoryRepository = leadCategoryRepository
    ;(useCase as any).locationRepository = locationRepository
  })

  describe('execute', () => {
    it('should return success when search completes', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())
      locationRepository.searchByName.mockResolvedValue([])

      const result = await useCase.execute('restaurants', 'BR', 'São Paulo')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should call google maps provider with correct parameters', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())
      locationRepository.searchByName.mockResolvedValue([])

      await useCase.execute('padarias', 'BR', 'São Paulo')

      expect(googleMapsProvider.search).toHaveBeenCalledWith(
        'padarias',
        'BR',
        'São Paulo'
      )
      expect(googleMapsProvider.search).toHaveBeenCalledTimes(1)
    })

    it('should handle empty search results', async () => {
      googleMapsProvider.search.mockResolvedValue(
        createMockSearchResponse({ places: [] })
      )
      locationRepository.searchByName.mockResolvedValue([])

      const result = await useCase.execute('xyznonexistent', 'BR', 'São Paulo')

      expect(result.ok).toBe(true)
      expect(result.hasError).toBe(false)
      expect(result.statusCode).toBe(HttpStatus.OK)
    })

    it('should return error when google maps provider throws', async () => {
      googleMapsProvider.search.mockRejectedValue(
        new Error('Error searching Google Maps: Network error')
      )

      const result = await useCase.execute('restaurants', 'BR', 'São Paulo')

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

      const result = await useCase.execute('restaurants', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(result.error.message[0]).toContain('Invalid API key')
    })

    it('should return error when rate limit is exceeded', async () => {
      googleMapsProvider.search.mockRejectedValue(
        new Error('Error searching Google Maps: Rate limit exceeded')
      )

      const result = await useCase.execute('restaurants', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.error.message[0]).toContain('Rate limit exceeded')
    })

    it('should handle unknown errors gracefully', async () => {
      googleMapsProvider.search.mockRejectedValue(new Error())

      const result = await useCase.execute('restaurants', 'BR', 'São Paulo')

      expect(result.ok).toBe(false)
      expect(result.hasError).toBe(true)
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should search with different country and location parameters', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())
      locationRepository.searchByName.mockResolvedValue([])

      await useCase.execute('dentistas', 'US', 'New York')

      expect(googleMapsProvider.search).toHaveBeenCalledWith(
        'dentistas',
        'US',
        'New York'
      )
    })

    it('should call location repository to search by name', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())
      locationRepository.searchByName.mockResolvedValue([])

      await useCase.execute('restaurants', 'BR', 'São Paulo')

      expect(locationRepository.searchByName).toHaveBeenCalledWith(
        'restaurants'
      )
    })
  })
})
