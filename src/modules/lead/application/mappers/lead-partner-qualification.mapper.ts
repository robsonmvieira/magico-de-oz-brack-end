import { LeadPartnerQualificationEntity } from '@modules/lead/domain/entities/lead-partner-qualification.entity'
import {
  LeadPartnerQualificationModel,
  NewLeadPartnerQualificationModel
} from '@modules/lead/domain/models/lead-partner-qualification.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface LeadPartnerQualificationOutput {
  id: string
  code: string
  description: string
}

export class LeadPartnerQualificationMapper {
  static toEntity(
    model: LeadPartnerQualificationModel
  ): LeadPartnerQualificationEntity {
    return LeadPartnerQualificationEntity.reconstitute({
      id: new UuidVO(model.id),
      code: model.code,
      description: model.description,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(
    entity: LeadPartnerQualificationEntity
  ): NewLeadPartnerQualificationModel {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }

  static toOutput(
    model: LeadPartnerQualificationModel
  ): LeadPartnerQualificationOutput {
    return {
      id: model.id,
      code: model.code,
      description: model.description
    }
  }

  static entityToOutput(
    entity: LeadPartnerQualificationEntity
  ): LeadPartnerQualificationOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }
}
