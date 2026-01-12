import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { LeadOutput } from '../list'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import {
  ILeadCategoryRepository,
  ILocationRepository
} from '@modules/lead/domain/repositories'

@Injectable()
export class SearchLeadUseCase {
  /* TODO
   - Buscar localizações por query
   - Classificar categorias por query
   - Buscar leads por localização
   - Buscar reviews por Google Place ID
   - Implementar o UOW
   - Criar Categoria
   - Criar Lead

 */
  @Inject('ILeadCategoryRepository')
  private readonly leadCategoryRepository: ILeadCategoryRepository
  @Inject('IGoogleMapsProvider')
  private readonly googleMapsProvider: IGoogleMapsProvider

  @Inject('ICategoryClassifierDomainService')
  private readonly categoryClassifier: ICategoryClassifierDomainService

  @Inject('ILocationRepository')
  private readonly locationRepository: ILocationRepository
  async execute(
    query: string,
    country: string,
    location: string
  ): Promise<ModelCollectionOutput<LeadOutput>> {
    try {
      const googleMapsData = await this.googleMapsProvider.search(
        query,
        country,
        location
      )

      console.log('query => ', query)
      console.log('location => ', location)
      console.log('googleMapsData => ', googleMapsData)
      console.log('finished => ')
      // Buscar localizações por query
      const locations = await this.locationRepository.searchByName(query)
      console.log('locations => ', locations)
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      console.log('error => ', error)
      console.log('finished on error => ')
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
