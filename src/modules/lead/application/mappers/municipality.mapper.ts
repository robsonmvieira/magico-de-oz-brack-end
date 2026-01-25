import { MunicipalityEntity } from '@modules/lead/domain/entities/municipality.entity'
import {
  MunicipalityModel,
  NewMunicipalityModel
} from '@modules/lead/domain/models/municipality.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface MunicipalityOutput {
  id: string
  code: string
  name: string
}

export class MunicipalityMapper {
  static toEntity(model: MunicipalityModel): MunicipalityEntity {
    return MunicipalityEntity.reconstitute({
      id: new UuidVO(model.id),
      code: model.code,
      name: model.name,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: MunicipalityEntity): NewMunicipalityModel {
    return {
      id: entity.id.id,
      code: entity.code,
      name: entity.name
    }
  }

  static toOutput(model: MunicipalityModel): MunicipalityOutput {
    return {
      id: model.id,
      code: model.code,
      name: model.name
    }
  }

  static entityToOutput(entity: MunicipalityEntity): MunicipalityOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      name: entity.name
    }
  }
}
