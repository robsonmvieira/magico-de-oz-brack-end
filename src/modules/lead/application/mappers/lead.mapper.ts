import { LeadEntity } from '@modules/lead/domain/entities/lead.entity'
import {
  LeadModel,
  NewLeadModel,
  AddressJson,
  GoogleMapsDataJson,
  CnpjDataJson,
  DecisionMakerJson,
  EnrichmentStatusJson,
  LeadScoreJson,
  ClassificationJson
} from '@modules/lead/domain/models'
import { LeadOutput } from '@modules/lead/application/use-cases/lead/list/dtos'
import {
  LeadId,
  LeadCategoryId,
  NameVO,
  PhoneVO,
  EmailVO,
  AddressVO,
  ClassificationVO,
  GoogleMapsDataVO,
  CnpjDataVO,
  DecisionMakerVO,
  EnrichmentStatusVO,
  LeadScoreVO
} from '@modules/lead/domain/valueObject'
import {
  LeadSource,
  LeadStage,
  LeadTemperature,
  CompanySize
} from '@modules/lead/domain/enums'
import { GooglePlace } from '@modules/lead/domain/services/googlemaps'

export class LeadMapper {
  /**
   * Converte Model (persistência) para Entity (domínio)
   */
  static toEntity(model: LeadModel): LeadEntity {
    return LeadEntity.reconstitute({
      id: new LeadId(model.id),
      leadCategoryId: new LeadCategoryId(model.leadCategoryId),
      companyName: NameVO.create(model.companyName),
      tradeName: model.tradeName ?? undefined,
      phone: model.phone ? PhoneVO.create(model.phone) : undefined,
      email: model.email ? EmailVO.create(model.email) : undefined,
      website: model.website ?? undefined,
      address: model.address ? AddressVO.create(model.address) : undefined,
      sizeClassification: model.sizeClassification
        ? ClassificationVO.create({
            value: model.sizeClassification.value as CompanySize,
            confidence: model.sizeClassification.confidence,
            method: model.sizeClassification.method
          })
        : undefined,
      googleMapsData: model.googleMapsData
        ? GoogleMapsDataVO.create({
            placeId: model.googleMapsData.placeId,
            category: model.googleMapsData.category,
            rating: model.googleMapsData.rating,
            reviewsCount: model.googleMapsData.reviewsCount
          })
        : undefined,
      cnpjWsData: model.cnpjWsData
        ? CnpjDataVO.create({
            cnpj: model.cnpjWsData.cnpj,
            businessName: model.cnpjWsData.businessName,
            openingDate: model.cnpjWsData.openingDate
              ? new Date(model.cnpjWsData.openingDate)
              : undefined,
            capital: model.cnpjWsData.capital,
            businessNature: model.cnpjWsData.businessNature,
            partners: model.cnpjWsData.partners
          })
        : undefined,
      decisionMakers: model.decisionMakers.map(dm =>
        DecisionMakerVO.create({
          name: dm.name,
          role: dm.role,
          email: dm.email,
          phone: dm.phone,
          linkedinUrl: dm.linkedinUrl,
          source: dm.source,
          isPrimary: dm.isPrimary
        })
      ),
      enrichmentStatus: EnrichmentStatusVO.create({
        googleMaps: {
          enriched: model.enrichmentStatus.googleMaps.enriched,
          at: model.enrichmentStatus.googleMaps.at
            ? new Date(model.enrichmentStatus.googleMaps.at)
            : undefined
        },
        cnpjWs: {
          enriched: model.enrichmentStatus.cnpjWs.enriched,
          at: model.enrichmentStatus.cnpjWs.at
            ? new Date(model.enrichmentStatus.cnpjWs.at)
            : undefined
        },
        apollo: {
          enriched: model.enrichmentStatus.apollo.enriched,
          at: model.enrichmentStatus.apollo.at
            ? new Date(model.enrichmentStatus.apollo.at)
            : undefined
        },
        hunter: {
          enriched: model.enrichmentStatus.hunter.enriched,
          at: model.enrichmentStatus.hunter.at
            ? new Date(model.enrichmentStatus.hunter.at)
            : undefined
        },
        linkedin: {
          enriched: model.enrichmentStatus.linkedin.enriched,
          at: model.enrichmentStatus.linkedin.at
            ? new Date(model.enrichmentStatus.linkedin.at)
            : undefined
        }
      }),
      score: LeadScoreVO.create({
        completeness: model.score.completeness,
        icpFit: model.score.icpFit,
        engagement: model.score.engagement
      }),
      temperature: model.temperature as LeadTemperature,
      stage: model.stage as LeadStage,
      source: model.source as LeadSource,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  /**
   * Converte Entity (domínio) para Model (persistência)
   */
  static toModel(entity: LeadEntity): NewLeadModel {
    const address: AddressJson | null = entity._address
      ? {
          street: entity._address.value.street,
          city: entity._address.value.city,
          state: entity._address.value.state,
          zipCode: entity._address.value.zipCode,
          neighborhood: entity._address.value.neighborhood,
          latitude: entity._address.value.latitude,
          longitude: entity._address.value.longitude
        }
      : null

    const googleMapsData: GoogleMapsDataJson | null = entity._googleMapsData
      ? {
          placeId: entity._googleMapsData.placeId,
          category: entity._googleMapsData.category,
          rating: entity._googleMapsData.rating,
          reviewsCount: entity._googleMapsData.reviewsCount
        }
      : null

    const cnpjWsData: CnpjDataJson | null = entity._cnpjWsData
      ? {
          cnpj: entity._cnpjWsData.cnpj,
          businessName: entity._cnpjWsData.businessName,
          openingDate: entity._cnpjWsData.openingDate?.toISOString(),
          capital: entity._cnpjWsData.capital,
          businessNature: entity._cnpjWsData.businessNature,
          partners: entity._cnpjWsData.partners
        }
      : null

    const decisionMakers: DecisionMakerJson[] = entity._decisionMakers.map(
      dm => ({
        name: dm.name,
        role: dm.role,
        email: dm.email?.value,
        phone: dm.phone?.value,
        linkedinUrl: dm.linkedinUrl,
        source: dm.source,
        isPrimary: dm.isPrimary
      })
    )

    const enrichmentStatus: EnrichmentStatusJson = {
      googleMaps: {
        enriched: entity._enrichmentStatus.googleMaps.enriched,
        at: entity._enrichmentStatus.googleMaps.at?.toISOString()
      },
      cnpjWs: {
        enriched: entity._enrichmentStatus.cnpjWs.enriched,
        at: entity._enrichmentStatus.cnpjWs.at?.toISOString()
      },
      apollo: {
        enriched: entity._enrichmentStatus.apollo.enriched,
        at: entity._enrichmentStatus.apollo.at?.toISOString()
      },
      hunter: {
        enriched: entity._enrichmentStatus.hunter.enriched,
        at: entity._enrichmentStatus.hunter.at?.toISOString()
      },
      linkedin: {
        enriched: entity._enrichmentStatus.linkedin.enriched,
        at: entity._enrichmentStatus.linkedin.at?.toISOString()
      }
    }

    const score: LeadScoreJson = {
      completeness: entity._score.completeness,
      icpFit: entity._score.icpFit,
      engagement: entity._score.engagement
    }

    const sizeClassification: ClassificationJson | null =
      entity._sizeClassification
        ? {
            value: entity._sizeClassification.value,
            confidence: entity._sizeClassification.confidence,
            method: entity._sizeClassification.method
          }
        : null

    return {
      id: entity.id.id,
      leadCategoryId: entity._leadCategoryId.id,
      companyName: entity._companyName.value,
      tradeName: entity._tradeName ?? null,
      phone: entity._phone?.value ?? null,
      email: entity._email?.value ?? null,
      website: entity._website ?? null,
      address,
      sizeClassification,
      googleMapsData,
      cnpjWsData,
      decisionMakers,
      enrichmentStatus,
      score,
      temperature: entity._temperature as LeadTemperature,
      stage: entity._stage as LeadStage,
      source: entity._source as LeadSource
    }
  }

  /**
   * Converte Model (persistência) para Output (DTO de resposta)
   */
  static toOutput(model: LeadModel): LeadOutput {
    return {
      id: model.id,
      leadCategoryId: model.leadCategoryId,
      companyName: model.companyName,
      tradeName: model.tradeName ?? undefined,
      phone: model.phone ?? undefined,
      email: model.email ?? undefined,
      website: model.website ?? undefined,
      address: model.address ?? undefined,
      sizeClassification: model.sizeClassification ?? undefined,
      googleMapsData: model.googleMapsData ?? undefined,
      cnpjWsData: model.cnpjWsData ?? undefined,
      decisionMakers: model.decisionMakers,
      enrichmentStatus: model.enrichmentStatus,
      score: model.score,
      temperature: model.temperature,
      stage: model.stage,
      source: model.source,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt ?? undefined
    }
  }

  /**
   * Converte Entity (domínio) para Output (DTO de resposta)
   */
  static entityToOutput(entity: LeadEntity): LeadOutput {
    return {
      id: entity.id.id,
      leadCategoryId: entity._leadCategoryId.id,
      companyName: entity._companyName.value,
      tradeName: entity._tradeName,
      phone: entity._phone?.value,
      email: entity._email?.value,
      website: entity._website,
      address: entity._address?.value,
      sizeClassification: entity._sizeClassification
        ? {
            value: entity._sizeClassification.value,
            confidence: entity._sizeClassification.confidence,
            method: entity._sizeClassification.method
          }
        : undefined,
      googleMapsData: entity._googleMapsData
        ? {
            placeId: entity._googleMapsData.placeId,
            category: entity._googleMapsData.category,
            rating: entity._googleMapsData.rating,
            reviewsCount: entity._googleMapsData.reviewsCount
          }
        : undefined,
      cnpjWsData: entity._cnpjWsData
        ? {
            cnpj: entity._cnpjWsData.cnpj,
            businessName: entity._cnpjWsData.businessName,
            openingDate: entity._cnpjWsData.openingDate?.toISOString(),
            capital: entity._cnpjWsData.capital,
            businessNature: entity._cnpjWsData.businessNature,
            partners: entity._cnpjWsData.partners
          }
        : undefined,
      decisionMakers: entity._decisionMakers.map(dm => ({
        name: dm.name,
        role: dm.role,
        email: dm.email?.value,
        phone: dm.phone?.value,
        linkedinUrl: dm.linkedinUrl,
        source: dm.source,
        isPrimary: dm.isPrimary
      })),
      enrichmentStatus: {
        googleMaps: {
          enriched: entity._enrichmentStatus.googleMaps.enriched,
          at: entity._enrichmentStatus.googleMaps.at?.toISOString()
        },
        cnpjWs: {
          enriched: entity._enrichmentStatus.cnpjWs.enriched,
          at: entity._enrichmentStatus.cnpjWs.at?.toISOString()
        },
        apollo: {
          enriched: entity._enrichmentStatus.apollo.enriched,
          at: entity._enrichmentStatus.apollo.at?.toISOString()
        },
        hunter: {
          enriched: entity._enrichmentStatus.hunter.enriched,
          at: entity._enrichmentStatus.hunter.at?.toISOString()
        },
        linkedin: {
          enriched: entity._enrichmentStatus.linkedin.enriched,
          at: entity._enrichmentStatus.linkedin.at?.toISOString()
        }
      },
      score: {
        completeness: entity._score.completeness,
        icpFit: entity._score.icpFit,
        engagement: entity._score.engagement
      },
      temperature: entity._temperature as string,
      stage: entity._stage as string,
      source: entity._source as string,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    }
  }

  static fromGooglePlaceToEntity(
    leadCategoryId: string,
    googlePlace: GooglePlace
  ): LeadEntity {
    const addressComponents = googlePlace.addressComponents || []
    return LeadEntity.create({
      leadCategoryId,
      companyName:
        googlePlace.name || googlePlace.displayName?.text || 'Unknown',
      source: LeadSource.GOOGLE_MAPS,
      tradeName: googlePlace.displayName?.text,
      phone: googlePlace.internationalPhoneNumber,
      website: googlePlace.websiteUri,
      address:
        addressComponents.length >= 4
          ? {
              street: addressComponents[0]?.longText,
              city: addressComponents[1]?.longText,
              state: addressComponents[1]?.shortText,
              zipCode: addressComponents[2]?.shortText,
              neighborhood: addressComponents[3]?.shortText,
              latitude: googlePlace.location?.latitude,
              longitude: googlePlace.location?.longitude
            }
          : undefined
    })
  }
}
