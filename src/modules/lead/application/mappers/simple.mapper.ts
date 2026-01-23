import { SimpleEntity } from '@modules/lead/domain/entities/contracts/simple.entity'
import {
  SimpleModel,
  NewSimpleModel
} from '@modules/lead/domain/models/simple.model'
import { UuidVO } from '@modules/core/domain/valueObject'

type SimpleOptionStatus = 'N' | 'S' | 'O'

export interface SimpleOutput {
  id: string
  basicDoc: string
  chooseSimpleModule: string | null
  dateSimpleModuleStart: Date | null
  dateExcludeSimpleModuleStart: Date | null
  chooseMEI: string | null
  dateMEIStart: Date | null
  dateExcludeMEIStart: Date | null
}

export class SimpleMapper {
  static toEntity(model: SimpleModel): SimpleEntity {
    return SimpleEntity.reconstitute({
      id: new UuidVO(model.id),
      basicDoc: model.basic_doc,
      chooseSimpleModule:
        (model.choose_simple_module as SimpleOptionStatus) ?? 'O',
      dateSimpleModuleStart: model.date_simple_module_start ?? undefined,
      dateExcludeSimpleModuleStart:
        model.date_exclude_simple_module_start ?? undefined,
      chooseMEI: (model.choose_mei as SimpleOptionStatus) ?? 'O',
      dateMEIStart: model.date_mei_start ?? undefined,
      dateExcludeMEIStart: model.date_exclude_mei_start ?? undefined,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: SimpleEntity): NewSimpleModel {
    return {
      id: entity.id.id,
      basic_doc: entity.basicDoc,
      choose_simple_module: entity.chooseSimpleModule,
      date_simple_module_start: entity.dateSimpleModuleStart ?? null,
      date_exclude_simple_module_start:
        entity.dateExcludeSimpleModuleStart ?? null,
      choose_mei: entity.chooseMEI,
      date_mei_start: entity.dateMEIStart ?? null,
      date_exclude_mei_start: entity.dateExcludeMEIStart ?? null
    }
  }

  static toOutput(model: SimpleModel): SimpleOutput {
    return {
      id: model.id,
      basicDoc: model.basic_doc,
      chooseSimpleModule: model.choose_simple_module,
      dateSimpleModuleStart: model.date_simple_module_start,
      dateExcludeSimpleModuleStart: model.date_exclude_simple_module_start,
      chooseMEI: model.choose_mei,
      dateMEIStart: model.date_mei_start,
      dateExcludeMEIStart: model.date_exclude_mei_start
    }
  }

  static entityToOutput(entity: SimpleEntity): SimpleOutput {
    return {
      id: entity.id.id,
      basicDoc: entity.basicDoc,
      chooseSimpleModule: entity.chooseSimpleModule,
      dateSimpleModuleStart: entity.dateSimpleModuleStart ?? null,
      dateExcludeSimpleModuleStart: entity.dateExcludeSimpleModuleStart ?? null,
      chooseMEI: entity.chooseMEI,
      dateMEIStart: entity.dateMEIStart ?? null,
      dateExcludeMEIStart: entity.dateExcludeMEIStart ?? null
    }
  }
}
