export class CategoryLeadMapper {
  static toEntity(entity: any): any {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      priority: entity.priority,
      scoreBonus: entity.scoreBonus,
      keywords: entity.keywords,
      color: entity.color
    }
  }

  static toOutput(entity: any): any {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      priority: entity.priority,
      scoreBonus: entity.scoreBonus,
      keywords: entity.keywords,
      color: entity.color
    }
  }
}
