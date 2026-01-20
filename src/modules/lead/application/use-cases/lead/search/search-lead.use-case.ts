import { IGoogleMapsProvider } from '@modules/lead/domain/services/googlemaps'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { LeadOutput } from '../list'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import {
  ILeadCategoryRepository,
  ILeadRepository
} from '@modules/lead/domain/repositories'
import { IUnitOfWork } from '@modules/core/domain/repositories'
import { DrizzleTransaction } from '@modules/database'
import { IAClassificationResult } from '@modules/lead/infra/services'
import { LeadCategoryMapper } from '@modules/lead/application/mappers'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { LeadEntity } from '@modules/lead/domain/entities'

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
  @Inject('ILeadRepository')
  private readonly leadRepository: ILeadRepository
  @Inject('ICategoryClassifierDomainService')
  private readonly categoryClassifier: ICategoryClassifierDomainService

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

      const CHUNK_SIZE = 10
      const chunks: any[] = []

      for (let i = 0; i < googleMapsData.places.length; i += CHUNK_SIZE) {
        chunks.push(googleMapsData.places.slice(i, i + CHUNK_SIZE))
      }

      for (const chunk of chunks) {
        // get category text to send to the classifier
        // const classificationText = this.buildClassificationText(place)

        // receive the category match from the classifier
        const classifications: IAClassificationResult[] =
          await this.categoryClassifier.classifyChunk(chunk)

        // unit of work to save the category and lead
        await this.uow.do(async tx => {
          for (const classification of classifications) {
            // create the category model from the classifier output
            const categoryModel = LeadCategoryMapper.toModelFromIAClassifier(
              classification.lead_category
            )
            // upsert category - inserts if not exists, ignores if already exists
            await this.leadCategoryRepository.upsert(categoryModel, tx)

            const leadEntity = this.buildLeadEntityFromGooglePlace(
              categoryModel.id,
              classification.place
            )
            const leadModel = LeadMapper.toModel(leadEntity)
            await this.leadRepository.save(leadModel, tx)
          }
        })
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

  private buildLeadEntityFromGooglePlace(
    leadCategoryId: string,
    googlePlace: any
  ): LeadEntity {
    return LeadMapper.fromGooglePlaceToEntity(leadCategoryId, googlePlace)
  }
}
