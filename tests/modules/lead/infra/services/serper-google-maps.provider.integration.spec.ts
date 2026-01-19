import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { SerperGoogleMapsProvider } from '@modules/lead/infra/services/serper-google-maps.provider'
import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps/googlemaps.provider'

describe.skip('SerperGoogleMapsProvider (Integration)', () => {
  let provider: IGoogleMapsProvider
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test'
        })
      ],
      providers: [
        {
          provide: 'IGoogleMapsProvider',
          useClass: SerperGoogleMapsProvider
        }
      ]
    }).compile()

    provider = module.get<IGoogleMapsProvider>('IGoogleMapsProvider')
  })

  afterAll(async () => {
    await module.close()
  })

  describe.skip('search', () => {
    it('should return places for a valid query', async () => {
      const result = await provider.search('restaurantes', 'BR', 'São Paulo')

      expect(result).toBeDefined()
      expect(result.places).toBeDefined()
      expect(Array.isArray(result.places)).toBe(true)
    }, 30000)

    it('should return empty places for an obscure query', async () => {
      const result = await provider.search(
        'xyznonexistentbusiness12345',
        'BR',
        'São Paulo'
      )

      expect(result).toBeDefined()
      expect(result.places).toBeDefined()
      expect(Array.isArray(result.places)).toBe(true)
    }, 30000)

    it('should include place details in results', async () => {
      const result = await provider.search('padarias', 'BR', 'São Paulo')

      expect(result.places.length).toBeGreaterThan(0)

      const place = result.places[0]
      expect(place.title).toBeDefined()
      expect(place.address).toBeDefined()
      expect(typeof place.latitude).toBe('number')
      expect(typeof place.longitude).toBe('number')
    }, 30000)
  })

  describe.skip('getReviews', () => {
    it('should return reviews for a valid place', async () => {
      const searchResult = await provider.search('Starbucks', 'BR', 'São Paulo')

      if (searchResult.places.length > 0) {
        const placeId = searchResult.places[0].title
        const result = await provider.getReviews(placeId, 'BR')

        expect(result).toBeDefined()
        expect(result.reviews).toBeDefined()
        expect(Array.isArray(result.reviews)).toBe(true)
      }
    }, 60000)
  })

  describe.skip('autoComplete', () => {
    it('should return suggestions for a valid query', async () => {
      const result = await provider.autoComplete(
        'restaurantes',
        'BR',
        'São Paulo'
      )

      expect(result).toBeDefined()
      expect(result.searchParameters).toBeDefined()
      expect(result.searchParameters.q).toBe('restaurantes')
      expect(result.suggestions).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
    }, 30000)

    it('should return suggestions with value property', async () => {
      const result = await provider.autoComplete('padarias', 'BR', 'São Paulo')

      expect(result.suggestions.length).toBeGreaterThan(0)

      const suggestion = result.suggestions[0]
      expect(suggestion.value).toBeDefined()
      expect(typeof suggestion.value).toBe('string')
    }, 30000)

    it('should handle partial query terms', async () => {
      const result = await provider.autoComplete('dentis', 'BR', 'São Paulo')

      expect(result).toBeDefined()
      expect(result.suggestions).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
    }, 30000)

    it('should work with different locations', async () => {
      const result = await provider.autoComplete(
        'restaurantes',
        'BR',
        'Rio de Janeiro'
      )

      expect(result).toBeDefined()
      expect(result.suggestions).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
    }, 30000)
  })
})
