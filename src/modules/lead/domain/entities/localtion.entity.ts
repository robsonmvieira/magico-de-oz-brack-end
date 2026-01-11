import { AggregateRoot } from '@modules/core/domain/entities'
import { LocationId } from '../valueObject'
import { ValueObject } from '@modules/core/domain/valueObject'

export type CreateLocationCommand = {
  name: string
  canonicalName: string
  googleId: number
  countryCode: string
  targetType: string
}

interface LocationProps {
  id?: LocationId
  name: string
  canonicalName: string
  googleId: number
  countryCode: string
  targetType: string
  created_at?: Date
  updated_at?: Date
  is_active?: boolean
  is_deleted?: boolean
  is_blocked?: boolean
  deleted_at?: Date
}
export class LocationEntity extends AggregateRoot {
  _name: string
  _canonicalName: string
  _googleId: number
  _countryCode: string
  _targetType: string
  private constructor({
    id,
    name,
    canonicalName,
    googleId,
    countryCode,
    targetType,
    created_at,
    updated_at,
    is_active,
    is_deleted,
    is_blocked,
    deleted_at
  }: LocationProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._name = name
    this._canonicalName = canonicalName
    this._googleId = googleId
    this._countryCode = countryCode
    this._targetType = targetType
  }

  static create({
    name,
    canonicalName,
    googleId,
    countryCode,
    targetType
  }: CreateLocationCommand) {
    return new LocationEntity({
      name,
      canonicalName,
      googleId,
      countryCode,
      targetType
    })
  }

  get entity_id(): ValueObject {
    return this.id
  }
  toJSON() {
    return {
      id: this.id.id,
      name: this._name,
      canonicalName: this._canonicalName,
      googleId: this._googleId,
      countryCode: this._countryCode,
      targetType: this._targetType
    }
  }
}
