import { CountryEntity } from '@modules/lead/domain/entities/country.entity'
import {
  CountryModel,
  NewCountryModel
} from '@modules/lead/domain/models/country.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface CountryOutput {
  id: string
  code: string
  name: string
}

export class CountryMapper {
  static toEntity(model: CountryModel): CountryEntity {
    return CountryEntity.reconstitute({
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

  static toModel(entity: CountryEntity): NewCountryModel {
    return {
      id: entity.id.id,
      code: entity.code,
      name: entity.name
    }
  }

  static toOutput(model: CountryModel): CountryOutput {
    return {
      id: model.id,
      code: model.code,
      name: model.name
    }
  }

  static entityToOutput(entity: CountryEntity): CountryOutput {
    return {
      id: entity.id.id,
      code: entity.code,
      name: entity.name
    }
  }
}
