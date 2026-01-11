import { SerperGoogleMapsProvider } from '@modules/lead/infra/services/serper-google-maps.provider'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('SerperGoogleMapsProvider', () => {
  let provider: SerperGoogleMapsProvider
  let configService: jest.Mocked<ConfigService>
  let mockAxiosInstance: {
    post: jest.Mock
  }

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn()
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any)

    configService = {
      get: jest.fn().mockReturnValue('test-api-key')
    } as any

    provider = new SerperGoogleMapsProvider(configService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://google.serper.dev',
        headers: {
          'X-API-KEY': 'test-api-key',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should get API key from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('SERPER_API_KEY')
    })
  })

  describe('search', () => {
    const mockSearchResponse = {
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
          address: 'Rua Test, 123',
          latitude: -23.55,
          longitude: -46.63,
          rating: 4.5,
          ratingCount: 100,
          priceLevel: '$$',
          type: 'Restaurant',
          types: ['restaurant', 'food']
        }
      ],
      credits: 1
    }

    it('should call API with correct parameters', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSearchResponse })

      await provider.search('restaurants', 'pt-BR')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/maps',
        JSON.stringify({ q: 'restaurants', hl: 'pt-BR' })
      )
    })

    it('should return search results on success', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSearchResponse })

      const result = await provider.search('restaurants', 'pt-BR')

      expect(result).toEqual(mockSearchResponse)
      expect(result.places).toHaveLength(1)
      expect(result.places[0].title).toBe('Restaurant ABC')
    })

    it('should throw error when API call fails', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'))

      await expect(provider.search('restaurants', 'pt-BR')).rejects.toThrow(
        'Error searching Google Maps: Network error'
      )
    })

    it('should throw error with API error message', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Invalid API key'))

      await expect(provider.search('restaurants', 'pt-BR')).rejects.toThrow(
        'Error searching Google Maps: Invalid API key'
      )
    })
  })

  describe('getReviews', () => {
    const mockReviewsResponse = {
      searchParameters: {
        cid: '12345',
        hl: 'pt-BR',
        type: 'reviews',
        num: 10,
        page: 1,
        engine: 'google_maps_reviews'
      },
      ll: '-23.55,-46.63',
      placeId: 'ChIJ12345',
      reviews: [
        {
          rating: 5,
          date: '2 weeks ago',
          isoDate: '2024-01-01T00:00:00.000Z',
          snippet: 'Great place!',
          likes: 10,
          user: {
            name: 'John Doe',
            thumbnail: 'https://example.com/photo.jpg',
            link: 'https://example.com/user',
            reviews: 50,
            photos: 20
          },
          media: [],
          id: 'review-1'
        }
      ],
      topics: [
        {
          name: 'Service',
          reviews: 10,
          id: 'topic-1'
        }
      ],
      nextPageToken: 'token123',
      credits: 1
    }

    it('should call API with correct parameters', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockReviewsResponse })

      await provider.getReviews('12345', 'pt-BR')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/reviews',
        JSON.stringify({ cid: '12345', hl: 'pt-BR' })
      )
    })

    it('should return reviews on success', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockReviewsResponse })

      const result = await provider.getReviews('12345', 'pt-BR')

      expect(result).toEqual(mockReviewsResponse)
      expect(result.reviews).toHaveLength(1)
      expect(result.reviews[0].snippet).toBe('Great place!')
    })

    it('should throw error when API call fails', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'))

      await expect(provider.getReviews('12345', 'pt-BR')).rejects.toThrow(
        'Error getting Google Maps reviews: Network error'
      )
    })

    it('should throw error with API error message', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(provider.getReviews('12345', 'pt-BR')).rejects.toThrow(
        'Error getting Google Maps reviews: Rate limit exceeded'
      )
    })
  })
})
