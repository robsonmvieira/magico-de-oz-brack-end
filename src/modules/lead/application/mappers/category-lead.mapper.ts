import { LeadCategoryEntity } from '@modules/lead/domain/entities/lead-category.entity'
import {
  LeadCategoryModel,
  NewLeadCategoryModel
} from '@modules/lead/domain/models/lead-category.model'
import { LeadCategoryOutput } from '@modules/lead/application/use-cases/lead-category/list/dtos'
import { LeadCategoryId } from '@modules/lead/domain/valueObject/lead-category.uuid'

export class LeadCategoryMapper {
  /**
   * Converte Model (persistência) para Entity (domínio)
   */
  static toEntity(model: LeadCategoryModel): LeadCategoryEntity {
    return LeadCategoryEntity.reconstitute({
      id: new LeadCategoryId(model.id),
      name: model.name,
      slug: model.slug,
      description: model.description ?? undefined,
      priority: model.priority,
      scoreBonus: model.score_bonus,
      keywords: model.keywords ? model.keywords.split(',') : [],
      color: model.color,
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
  static toModel(entity: LeadCategoryEntity): NewLeadCategoryModel {
    return {
      id: entity.id.id,
      name: entity._name.value,
      slug: entity._slug.value,
      description: entity._description,
      priority: entity._priority.value,
      score_bonus: entity._scoreBonus.value,
      keywords: entity._keywords.items.map(k => k.value).join(','),
      color: entity._color.value
    }
  }

  /**
   * Converte Model (persistência) para Output (DTO de resposta)
   */
  static toOutput(model: LeadCategoryModel): LeadCategoryOutput {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      description: model.description ?? '',
      priority: model.priority,
      scoreBonus: model.score_bonus,
      keywords: model.keywords ? model.keywords.split(',') : [],
      color: model.color
    }
  }

  /**
   * Converte Entity (domínio) para Output (DTO de resposta)
   */
  static entityToOutput(entity: LeadCategoryEntity): LeadCategoryOutput {
    return {
      id: entity.id.id,
      name: entity._name.value,
      slug: entity._slug.value,
      description: entity._description ?? '',
      priority: entity._priority.value,
      scoreBonus: entity._scoreBonus.value,
      keywords: entity._keywords.items.map(k => k.value),
      color: entity._color.value
    }
  }
}
