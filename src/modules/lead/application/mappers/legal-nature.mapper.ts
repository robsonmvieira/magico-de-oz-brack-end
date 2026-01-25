import { LegalNatureEntity } from '@modules/lead/domain/entities/legal-nature.entity'
import {
  LegalNatureModel,
  NewLegalNatureModel
} from '@modules/lead/domain/models/legal-nature.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface LegalNatureOutput {
  id: string
  code: string
  description: string
}

export class LegalNatureMapper {
  static toEntity(model: LegalNatureModel): LegalNatureEntity {
    return LegalNatureEntity.reconstitute({
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

  static toModel(entity: LegalNatureEntity): NewLegalNatureModel {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }

  static toOutput(model: LegalNatureModel): LegalNatureOutput {
    return {
      id: model.id,
      code: model.code,
      description: model.description
    }
  }

  static entityToOutput(entity: LegalNatureEntity): LegalNatureOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }
}
