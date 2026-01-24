import { PartnerEntity } from '@modules/lead/domain/entities/partner.entity'
import {
  PartnerModel,
  NewPartnerModel
} from '@modules/lead/domain/models/partner.model'
import { UuidVO } from '@modules/core/domain/valueObject'

type PartnerIdentifier = '1' | '2' | '3'

export interface PartnerOutput {
  id: string
  basicCnpj: string
  partnerIdentifier: string | null
  partnerName: string | null
  partnerDoc: string | null
  partnerQualification: string | null
  entryDate: Date | null
  countryCode: string | null
  legalRepresentativeDoc: string | null
  legalRepresentativeName: string | null
  legalRepresentativeQualification: string | null
  ageRange: string | null
  partnerTypeDescription: string
  ageRangeDescription: string
}

export class PartnerMapper {
  static toEntity(model: PartnerModel): PartnerEntity {
    return PartnerEntity.reconstitute({
      id: new UuidVO(model.id),
      basicCnpj: model.basic_cnpj,
      partnerIdentifier:
        (model.partner_identifier as PartnerIdentifier) ?? undefined,
      partnerName: model.partner_name ?? undefined,
      partnerDoc: model.partner_doc ?? undefined,
      partnerQualification: model.partner_qualification ?? undefined,
      entryDate: model.entry_date ?? undefined,
      countryCode: model.country_code ?? undefined,
      legalRepresentativeDoc: model.legal_representative_doc ?? undefined,
      legalRepresentativeName: model.legal_representative_name ?? undefined,
      legalRepresentativeQualification:
        model.legal_representative_qualification ?? undefined,
      ageRange: model.age_range ?? undefined,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: PartnerEntity): NewPartnerModel {
    return {
      id: entity.id.id,
      basic_cnpj: entity.basicCnpj,
      partner_identifier: entity.partnerIdentifier ?? null,
      partner_name: entity.partnerName ?? null,
      partner_doc: entity.partnerDoc ?? null,
      partner_qualification: entity.partnerQualification ?? null,
      entry_date: entity.entryDate ?? null,
      country_code: entity.countryCode ?? null,
      legal_representative_doc: entity.legalRepresentativeDoc ?? null,
      legal_representative_name: entity.legalRepresentativeName ?? null,
      legal_representative_qualification:
        entity.legalRepresentativeQualification ?? null,
      age_range: entity.ageRange ?? null
    }
  }

  static toOutput(model: PartnerModel): PartnerOutput {
    const entity = this.toEntity(model)
    return {
      id: model.id,
      basicCnpj: model.basic_cnpj,
      partnerIdentifier: model.partner_identifier,
      partnerName: model.partner_name,
      partnerDoc: model.partner_doc,
      partnerQualification: model.partner_qualification,
      entryDate: model.entry_date,
      countryCode: model.country_code,
      legalRepresentativeDoc: model.legal_representative_doc,
      legalRepresentativeName: model.legal_representative_name,
      legalRepresentativeQualification:
        model.legal_representative_qualification,
      ageRange: model.age_range,
      partnerTypeDescription: entity.getPartnerTypeDescription(),
      ageRangeDescription: entity.getAgeRangeDescription()
    }
  }

  static entityToOutput(entity: PartnerEntity): PartnerOutput {
    return {
      id: entity.id.id,
      basicCnpj: entity.basicCnpj,
      partnerIdentifier: entity.partnerIdentifier ?? null,
      partnerName: entity.partnerName ?? null,
      partnerDoc: entity.partnerDoc ?? null,
      partnerQualification: entity.partnerQualification ?? null,
      entryDate: entity.entryDate ?? null,
      countryCode: entity.countryCode ?? null,
      legalRepresentativeDoc: entity.legalRepresentativeDoc ?? null,
      legalRepresentativeName: entity.legalRepresentativeName ?? null,
      legalRepresentativeQualification:
        entity.legalRepresentativeQualification ?? null,
      ageRange: entity.ageRange ?? null,
      partnerTypeDescription: entity.getPartnerTypeDescription(),
      ageRangeDescription: entity.getAgeRangeDescription()
    }
  }
}
