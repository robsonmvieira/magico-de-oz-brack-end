export type CreateLocationCommand = {
  name: string
  canonicalName: string
  googleId: number
  countryCode: string
  targetType: string
}

interface LocationProps {
  id?: number
  name: string
  canonicalName: string
  googleId: number
  countryCode: string
  targetType: string
}

export class LocationEntity {
  private readonly _id?: number
  private readonly _name: string
  private readonly _canonicalName: string
  private readonly _googleId: number
  private readonly _countryCode: string
  private readonly _targetType: string

  private constructor({
    id,
    name,
    canonicalName,
    googleId,
    countryCode,
    targetType
  }: LocationProps) {
    this._id = id
    this._name = name
    this._canonicalName = canonicalName
    this._googleId = googleId
    this._countryCode = countryCode
    this._targetType = targetType
  }

  static create(props: CreateLocationCommand): LocationEntity {
    return new LocationEntity(props)
  }

  static restore(props: LocationProps): LocationEntity {
    return new LocationEntity(props)
  }

  get id(): number | undefined {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get canonicalName(): string {
    return this._canonicalName
  }

  get googleId(): number {
    return this._googleId
  }

  get countryCode(): string {
    return this._countryCode
  }

  get targetType(): string {
    return this._targetType
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      canonicalName: this._canonicalName,
      googleId: this._googleId,
      countryCode: this._countryCode,
      targetType: this._targetType
    }
  }
}
