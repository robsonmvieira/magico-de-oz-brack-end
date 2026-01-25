import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type CreateMunicipalityCommand = {
  code: string
  name: string
}

interface MunicipalityProps extends DefaultEntityProps {
  code: string
  name: string
}

export class MunicipalityEntity extends Entity {
  private readonly _code: string
  private readonly _name: string

  private constructor({
    code,
    name,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: MunicipalityProps) {
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
    this._name = name
  }

  static reconstitute(props: MunicipalityProps): MunicipalityEntity {
    return new MunicipalityEntity(props)
  }

  static create(command: CreateMunicipalityCommand): MunicipalityEntity {
    return new MunicipalityEntity(command)
  }

  // -------------------- Getters --------------------

  get code(): string {
    return this._code
  }

  get name(): string {
    return this._name
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      code: this._code,
      name: this._name
    }
  }
}
