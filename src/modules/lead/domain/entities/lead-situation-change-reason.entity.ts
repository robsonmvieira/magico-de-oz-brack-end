import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type CreateLeadSituationChangeReasonCommand = {
  code: string
  description: string
}

interface LeadSituationChangeReasonProps extends DefaultEntityProps {
  code: string
  description: string
}

export class LeadSituationChangeReasonEntity extends Entity {
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
  }: LeadSituationChangeReasonProps) {
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

  static reconstitute(
    props: LeadSituationChangeReasonProps
  ): LeadSituationChangeReasonEntity {
    return new LeadSituationChangeReasonEntity(props)
  }

  static create(
    command: CreateLeadSituationChangeReasonCommand
  ): LeadSituationChangeReasonEntity {
    return new LeadSituationChangeReasonEntity(command)
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
