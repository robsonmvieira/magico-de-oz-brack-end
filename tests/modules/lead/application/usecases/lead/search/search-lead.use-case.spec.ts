import { SearchLeadUseCase } from '@modules/lead/application/use-cases/lead/search/search-lead.use-case'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'
import { HttpStatus } from '@nestjs/common'
import { GooglePlaceResponse } from '@modules/lead/domain/services/googlemaps/types'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import {
  ILeadCategoryRepository,
  ILeadRepository,
  ILocationRepository
} from '@modules/lead/domain/repositories'
import { IUnitOfWork } from '@modules/core/domain/repositories'

const createMockGoogleMapsProvider = (): jest.Mocked<IGoogleMapsProvider> => ({
  search: jest.fn(),
  getReviews: jest.fn(),
  autoComplete: jest.fn()
})

const createMockCategoryClassifier =
  (): jest.Mocked<ICategoryClassifierDomainService> => ({
    findBestMatch: jest.fn(),
    classifyChunk: jest.fn()
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
    findActive: jest.fn(),
    upsert: jest.fn()
  })

const createMockLeadRepository = (): jest.Mocked<ILeadRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCompanyName: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByCategoryId: jest.fn(),
  findByStage: jest.fn(),
  findByTemperature: jest.fn(),
  findActive: jest.fn(),
  findByGooglePlaceId: jest.fn(),
  findByCnpj: jest.fn(),
  exists: jest.fn(),
  existsByCompanyName: jest.fn(),
  existsByEmail: jest.fn(),
  findByMEI: jest.fn(),
  findSimpleByBasicDoc: jest.fn(),
  createSimple: jest.fn(),
  bulkSimple: jest.fn(),
  bulkSimpleInsert: jest.fn(),
  copySimpleFromStream: jest.fn(),
  findPartnersByBasicCnpj: jest.fn(),
  findPartnerByDoc: jest.fn(),
  createPartner: jest.fn(),
  bulkPartnerInsert: jest.fn(),
  findCountryByCode: jest.fn(),
  findAllCountries: jest.fn(),
  createCountry: jest.fn(),
  bulkCountryInsert: jest.fn()
})

const createMockUnitOfWork = (): jest.Mocked<IUnitOfWork<any>> => ({
  do: jest.fn().mockImplementation(async fn => fn({})),
  addAggregate: jest.fn(),
  getAggregates: jest.fn()
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSearchResponse = (overrides: any = {}): GooglePlaceResponse =>
  ({
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
  }) as unknown as GooglePlaceResponse

describe('SearchLeadUseCase', () => {
  let useCase: SearchLeadUseCase
  let googleMapsProvider: jest.Mocked<IGoogleMapsProvider>
  let categoryClassifier: jest.Mocked<ICategoryClassifierDomainService>
  let leadCategoryRepository: jest.Mocked<ILeadCategoryRepository>
  let leadRepository: jest.Mocked<ILeadRepository>
  let locationRepository: jest.Mocked<ILocationRepository>
  let uow: jest.Mocked<IUnitOfWork<any>>

  beforeEach(() => {
    googleMapsProvider = createMockGoogleMapsProvider()
    categoryClassifier = createMockCategoryClassifier()
    leadCategoryRepository = createMockLeadCategoryRepository()
    leadRepository = createMockLeadRepository()
    locationRepository = createMockLocationRepository()
    uow = createMockUnitOfWork()

    useCase = new SearchLeadUseCase()
    ;(useCase as any).googleMapsProvider = googleMapsProvider
    ;(useCase as any).categoryClassifier = categoryClassifier
    ;(useCase as any).leadCategoryRepository = leadCategoryRepository
    ;(useCase as any).leadRepository = leadRepository
    ;(useCase as any).locationRepository = locationRepository
    ;(useCase as any).uow = uow
  })

  describe('execute', () => {
    it('should return success when search completes', async () => {
      googleMapsProvider.search.mockResolvedValue(createMockSearchResponse())
      categoryClassifier.classifyChunk.mockResolvedValue([
        {
          lead_category: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Restaurantes',
            slug: 'restaurantes',
            description: 'Restaurantes em geral',
            priority: 1,
            score_bonus: 0,
            keywords: ['restaurante', 'comida'],
            color: 'blue'
          },
          is_new_category: false,
          confidence_score: 0.95,
          place: {
            id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Restaurant ABC',
            displayName: { text: 'Restaurant ABC' },
            formattedAddress:
              'Rua Test, 123, Centro, São Paulo - SP, 01234-567',
            internationalPhoneNumber: '11999999999',
            websiteUri: 'https://restaurantabc.com.br',
            location: { latitude: -23.55, longitude: -46.63 },
            addressComponents: [
              { longText: 'Rua Test, 123', shortText: 'Rua Test, 123' },
              { longText: 'São Paulo', shortText: 'SP' },
              { longText: '01234-567', shortText: '01234-567' },
              { longText: 'Centro', shortText: 'Centro' }
            ]
          }
        }
      ])

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
  })
})
