import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type CreateLegalNatureCommand = {
  code: string
  description: string
}

interface LegalNatureProps extends DefaultEntityProps {
  code: string
  description: string
}

export class LegalNatureEntity extends Entity {
  private readonly _code: string
  private readonly _description: string

  private constructor({
    code,
    description,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: LegalNatureProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._code = code
    this._description = description
  }

  static reconstitute(props: LegalNatureProps): LegalNatureEntity {
    return new LegalNatureEntity(props)
  }

  static create(command: CreateLegalNatureCommand): LegalNatureEntity {
    return new LegalNatureEntity(command)
  }

  // -------------------- Getters --------------------

  get code(): string {
    return this._code
  }

  get description(): string {
    return this._description
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      code: this._code,
      description: this._description
    }
  }
}
