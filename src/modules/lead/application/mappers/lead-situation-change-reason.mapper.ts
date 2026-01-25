import { LeadSituationChangeReasonEntity } from '@modules/lead/domain/entities/lead-situation-change-reason.entity'
import {
  LeadSituationChangeReasonModel,
  NewLeadSituationChangeReasonModel
} from '@modules/lead/domain/models/lead-situation-change-reason.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface LeadSituationChangeReasonOutput {
  id: string
  code: string
  description: string
}

export class LeadSituationChangeReasonMapper {
  static toEntity(
    model: LeadSituationChangeReasonModel
  ): LeadSituationChangeReasonEntity {
    return LeadSituationChangeReasonEntity.reconstitute({
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
    entity: LeadSituationChangeReasonEntity
  ): NewLeadSituationChangeReasonModel {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }

  static toOutput(
    model: LeadSituationChangeReasonModel
  ): LeadSituationChangeReasonOutput {
    return {
      id: model.id,
      code: model.code,
      description: model.description
    }
  }

  static entityToOutput(
    entity: LeadSituationChangeReasonEntity
  ): LeadSituationChangeReasonOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }
}
