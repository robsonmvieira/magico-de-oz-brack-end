import { CnaeEntity } from '@modules/lead/domain/entities/cnae.entity'
import { CnaeModel, NewCnaeModel } from '@modules/lead/domain/models/cnae.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface CnaeOutput {
  id: string
  code: string
  description: string
}

export class CnaeMapper {
  static toEntity(model: CnaeModel): CnaeEntity {
    return CnaeEntity.reconstitute({
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

  static toModel(entity: CnaeEntity): NewCnaeModel {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }

  static toOutput(model: CnaeModel): CnaeOutput {
    return {
      id: model.id,
      code: model.code,
      description: model.description
    }
  }

  static entityToOutput(entity: CnaeEntity): CnaeOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      description: entity.description
    }
  }
}
