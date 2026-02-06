import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import {
  ILeadRepository,
  ILeadCategoryRepository
} from '@modules/lead/domain/repositories'
import { IUnitOfWork } from '@modules/core/domain/repositories'
import { DrizzleTransaction } from '@modules/database'
import { LeadEntity } from '@modules/lead/domain/entities/lead.entity'
import {
  LeadSource,
  BusinessSector,
  BusinessSectorLabels
} from '@modules/lead/domain/enums'
import { CnpjDataVO, GoogleMapsDataVO } from '@modules/lead/domain/valueObject'
import {
  LeadMapper,
  LeadCategoryMapper
} from '@modules/lead/application/mappers'
import {
  IGoogleMapsProvider,
  GooglePlace
} from '@modules/lead/domain/services/googlemaps'
import { ICategoryClassifierDomainService } from '@modules/lead/domain/domain-services'
import { IAClassificationResult } from '@modules/lead/infra/services'
import { SearchLeadResult } from '../search-by-criteria/dtos'
import {
  CreateFromCriteriaInput,
  CreateFromCriteriaOutput,
  CreatedLeadInfo
} from './dtos'

interface LeadWithContext {
  rfData: SearchLeadResult
  googlePlace: GooglePlace | null
  source: 'google_places' | 'receita_federal_only'
}

@Injectable()
export class CreateFromCriteriaUseCase {
  @Inject('IUnitOfWork')
  private readonly uow: IUnitOfWork<DrizzleTransaction>

  @Inject('ILeadRepository')
  private readonly leadRepository: ILeadRepository

  @Inject('ILeadCategoryRepository')
  private readonly leadCategoryRepository: ILeadCategoryRepository

  @Inject('IGoogleMapsProvider')
  private readonly googleMapsProvider: IGoogleMapsProvider

  @Inject('ICategoryClassifierDomainService')
  private readonly categoryClassifier: ICategoryClassifierDomainService

  async execute(
    input: CreateFromCriteriaInput
  ): Promise<ModelOutput<CreateFromCriteriaOutput>> {
    try {
      const created: CreatedLeadInfo[] = []
      const errors: Array<{
        cnpj: string
        companyName: string
        message: string
      }> = []

      // Step 1: Search Google Places for each lead
      const leadsWithContext = await this.searchGooglePlaces(input.leads)

      // Step 2: Build classification payloads (Google data or RF fallback)
      const placesForClassification =
        this.buildClassificationPayloads(leadsWithContext)

      // Step 3: Send to classifier in chunks
      const CHUNK_SIZE = 10
      for (let i = 0; i < placesForClassification.length; i += CHUNK_SIZE) {
        const chunk = placesForClassification.slice(i, i + CHUNK_SIZE)
        const contextChunk = leadsWithContext.slice(i, i + CHUNK_SIZE)

        try {
          const classifications: IAClassificationResult[] =
            await this.categoryClassifier.classifyChunk(chunk)

          // Step 4: Create leads with classified categories
          await this.uow.do(async tx => {
            for (let j = 0; j < classifications.length; j++) {
              const classification = classifications[j]
              const context = contextChunk[j]

              try {
                // Upsert category
                const categoryModel =
                  LeadCategoryMapper.toModelFromIAClassifier(
                    classification.lead_category
                  )
                await this.leadCategoryRepository.upsert(categoryModel, tx)

                // Create lead
                const lead = this.createLeadFromContext(
                  context,
                  categoryModel.id
                )
                const leadModel = LeadMapper.toModel(lead)
                await this.leadRepository.save(leadModel, tx)

                created.push({
                  lead: LeadMapper.entityToOutput(lead),
                  source: context.source,
                  categoryId: categoryModel.id,
                  categoryName: classification.lead_category.name
                })
              } catch (error) {
                errors.push({
                  cnpj: context.rfData.fullCnpj,
                  companyName: context.rfData.companyName,
                  message: error.message || 'Erro ao criar lead'
                })
              }
            }
          })
        } catch (error) {
          // If classification fails for the entire chunk, add all to errors
          for (const context of contextChunk) {
            errors.push({
              cnpj: context.rfData.fullCnpj,
              companyName: context.rfData.companyName,
              message: `Erro na classificação: ${error.message}`
            })
          }
        }
      }

      const output = new CreateFromCriteriaOutput({ created, errors })

      return new ModelOutput<CreateFromCriteriaOutput>({
        data: output,
        hasError: errors.length > 0,
        error:
          errors.length > 0
            ? { message: [`${errors.length} lead(s) com erro`] }
            : null,
        statusCode:
          created.length === 0 ? HttpStatus.BAD_REQUEST : HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput<CreateFromCriteriaOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Erro ao criar leads'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }

  private async searchGooglePlaces(
    leads: SearchLeadResult[]
  ): Promise<LeadWithContext[]> {
    const results: LeadWithContext[] = []

    for (const lead of leads) {
      const query = lead.tradeName || lead.companyName
      const location = this.buildLocation(lead)

      try {
        const response = await this.googleMapsProvider.search(
          query,
          'Brazil',
          location
        )

        if (response.places?.length > 0) {
          // Use the first (best) match
          results.push({
            rfData: lead,
            googlePlace: response.places[0],
            source: 'google_places'
          })
        } else {
          results.push({
            rfData: lead,
            googlePlace: null,
            source: 'receita_federal_only'
          })
        }
      } catch {
        results.push({
          rfData: lead,
          googlePlace: null,
          source: 'receita_federal_only'
        })
      }
    }

    return results
  }

  private buildLocation(lead: SearchLeadResult): string {
    const city = lead.address?.city || ''
    const state = lead.address?.state || ''
    return `${city}, ${state}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
  }

  private buildClassificationPayloads(
    leadsWithContext: LeadWithContext[]
  ): Array<GooglePlace | Partial<GooglePlace>> {
    return leadsWithContext.map(context => {
      if (context.googlePlace) {
        // Use Google Place data for classification
        return context.googlePlace
      }

      // Build a mock place object from RF data for classification
      return this.buildMockPlaceFromRF(context.rfData)
    })
  }

  private buildMockPlaceFromRF(rf: SearchLeadResult): Partial<GooglePlace> {
    const sectorLabel = BusinessSectorLabels[rf.sector] || rf.sector
    const displayName = rf.tradeName || rf.companyName

    return {
      id: `rf-${rf.fullCnpj}`,
      name: displayName,
      displayName: { text: displayName, languageCode: 'pt-BR' },
      formattedAddress: this.buildAddressString(rf),
      primaryType: this.mapSectorToType(rf.sector),
      types: [this.mapSectorToType(rf.sector)],
      primaryTypeDisplayName: { text: sectorLabel, languageCode: 'pt-BR' },
      editorialSummary: {
        text: `${rf.companyName} - ${sectorLabel}. CNAE: ${rf.mainCnae}`,
        languageCode: 'pt-BR'
      }
    }
  }

  private buildAddressString(rf: SearchLeadResult): string {
    const parts = [
      rf.address?.street,
      rf.address?.number,
      rf.address?.neighborhood,
      rf.address?.city,
      rf.address?.state,
      rf.address?.zipCode
    ].filter(Boolean)
    return parts.join(', ')
  }

  private mapSectorToType(sector: BusinessSector): string {
    const sectorToType: Record<BusinessSector, string> = {
      [BusinessSector.TECH]: 'technology_company',
      [BusinessSector.FINANCE]: 'financial_institution',
      [BusinessSector.HEALTH]: 'health_establishment',
      [BusinessSector.EDUCATION]: 'educational_institution',
      [BusinessSector.RETAIL]: 'retail_store',
      [BusinessSector.INDUSTRY]: 'industrial_facility',
      [BusinessSector.AGRO]: 'agricultural_business',
      [BusinessSector.CONSTRUCTION]: 'construction_company',
      [BusinessSector.LOGISTICS]: 'logistics_company',
      [BusinessSector.HOSPITALITY]: 'restaurant',
      [BusinessSector.REAL_ESTATE]: 'real_estate_agency',
      [BusinessSector.SERVICES]: 'business_services'
    }
    return sectorToType[sector] || 'business_establishment'
  }

  private createLeadFromContext(
    context: LeadWithContext,
    categoryId: string
  ): LeadEntity {
    const rf = context.rfData
    const gp = context.googlePlace

    const lead = LeadEntity.create({
      leadCategoryId: categoryId,
      companyName: rf.companyName,
      tradeName: rf.tradeName || gp?.displayName?.text || undefined,
      source: gp ? LeadSource.GOOGLE_MAPS : LeadSource.IMPORTED,
      phone: gp?.internationalPhoneNumber || rf.phone || undefined,
      email: rf.email || undefined,
      website: gp?.websiteUri || undefined,
      address: rf.address
        ? {
            street: rf.address.street || undefined,
            city: rf.address.city || undefined,
            state: rf.address.state || undefined,
            zipCode: rf.address.zipCode || undefined,
            neighborhood: rf.address.neighborhood || undefined
          }
        : undefined
    })

    // Enrich with CNPJ data
    this.enrichWithCnpjData(lead, rf)

    // Enrich with Google Maps data if available
    if (gp) {
      this.enrichWithGoogleData(lead, gp)
    }

    return lead
  }

  private enrichWithCnpjData(lead: LeadEntity, rf: SearchLeadResult): void {
    if (!rf.fullCnpj) return

    try {
      const cnpjData = CnpjDataVO.create({
        cnpj: rf.fullCnpj,
        businessName: rf.companyName,
        openingDate: rf.activityStartDate
          ? this.parseActivityDate(rf.activityStartDate)
          : undefined,
        capital: rf.socialCapital
          ? Number.parseFloat(rf.socialCapital)
          : undefined,
        partners: rf.partners?.map(p => ({
          name: p.name || '',
          qualification: p.qualification || ''
        }))
      })

      lead.enrichWithCnpj(cnpjData)
    } catch {
      // If CNPJ is invalid, skip enrichment
    }
  }

  private enrichWithGoogleData(lead: LeadEntity, gp: GooglePlace): void {
    if (!gp.id) return

    const googleData = GoogleMapsDataVO.create({
      placeId: gp.id,
      category: gp.primaryType || 'business',
      rating: gp.rating,
      reviewsCount: gp.userRatingCount
    })

    lead.enrichWithGoogleMaps(googleData)
  }

  private parseActivityDate(dateStr: string): Date | undefined {
    if (dateStr?.length !== 8) return undefined

    const year = Number.parseInt(dateStr.substring(0, 4))
    const month = Number.parseInt(dateStr.substring(4, 6)) - 1
    const day = Number.parseInt(dateStr.substring(6, 8))

    const date = new Date(year, month, day)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
}
