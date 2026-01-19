import {
  GooglePlace,
  IGoogleMapsProvider
} from '@modules/lead/domain/services/googlemaps'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { LeadOutput } from '../list'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import { ILeadCategoryRepository } from '@modules/lead/domain/repositories'
import { IUnitOfWork } from '@modules/core/domain/repositories'
import { DrizzleTransaction } from '@modules/database'
import {
  IALeadCategoryClassifierInput,
  IALeadCategoryClassifierOutput
} from '@modules/lead/infra/services'

@Injectable()
export class SearchLeadUseCase {
  /* TODO
   - Buscar localizações por query
   - Buscar leads por localização
   - Buscar reviews por Google Place ID
   - Implementar o UOW
   - Criar Categoria
   - Criar Lead

 */
  @Inject('IUnitOfWork')
  private readonly uow: IUnitOfWork<DrizzleTransaction>
  @Inject('ILeadCategoryRepository')
  private readonly leadCategoryRepository: ILeadCategoryRepository
  @Inject('IGoogleMapsProvider')
  private readonly googleMapsProvider: IGoogleMapsProvider

  @Inject('ICategoryClassifierDomainService')
  private readonly categoryClassifier: ICategoryClassifierDomainService

  // @Inject('ILocationRepository')
  // private readonly locationRepository: ILocationRepository

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

      for (const [index, place] of googleMapsData.places.entries()) {
        if (index > 1) break
        const classificationText = this.buildClassificationText(place)
        const categoryMatch: IALeadCategoryClassifierOutput =
          await this.categoryClassifier.findBestMatch(classificationText)

        // console.log('Place:', place.displayName?.text)
        // console.log('Classification text:', classificationText)
        // console.log('Category match:', categoryMatch?.category?._name ?? 'None')
        // console.log('Confidence:', categoryMatch?.confidence ?? 0)
        console.log('is new category:', categoryMatch?.data?.is_new_category)
        // console.log(
        //   'classification metadata:',
        //   categoryMatch?.classification_metadata
        // )
        console.log('---')
      }

      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      console.log('error => ', error)
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }

  private buildClassificationText(
    place: GooglePlace
  ): IALeadCategoryClassifierInput {
    return {
      place_data: {
        primaryType: place.primaryType,
        types: place.types,
        displayName: { text: place.displayName?.text ?? '' },
        primaryTypeDisplayName: {
          text: place.primaryTypeDisplayName?.text ?? ''
        },
        editorialSummary: { text: place.editorialSummary?.text ?? '' },
        priceLevel: place.priceLevel ?? '',
        servesBeer: place.servesBeer ?? false,
        servesWine: place.servesWine ?? false,
        servesCocktails: place.servesCocktails ?? false,
        servesBreakfast: place.servesBreakfast ?? false,
        servesLunch: place.servesLunch ?? false,
        servesDinner: place.servesDinner ?? false
      },
      allow_new_categories: true
    }
  }
}
