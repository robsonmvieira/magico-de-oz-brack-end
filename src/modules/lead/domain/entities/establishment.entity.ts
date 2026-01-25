import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type CreateEstablishmentCommand = {
  basicCnpj: string
  cnpjOrder: string
  cnpjDv: string
  branchType: string
  tradeName?: string
  registrationStatus: string
  registrationStatusDate?: string
  registrationStatusReason?: string
  foreignCityName?: string
  countryCode?: string
  activityStartDate?: string
  mainCnae: string
  secondaryCnaes?: string
  streetType?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  zipCode?: string
  state?: string
  cityCode?: string
  ddd1?: string
  phone1?: string
  ddd2?: string
  phone2?: string
  faxDdd?: string
  fax?: string
  email?: string
  specialSituation?: string
  specialSituationDate?: string
}

interface EstablishmentProps extends DefaultEntityProps {
  basicCnpj: string
  cnpjOrder: string
  cnpjDv: string
  branchType: string
  tradeName?: string
  registrationStatus: string
  registrationStatusDate?: string
  registrationStatusReason?: string
  foreignCityName?: string
  countryCode?: string
  activityStartDate?: string
  mainCnae: string
  secondaryCnaes?: string
  streetType?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  zipCode?: string
  state?: string
  cityCode?: string
  ddd1?: string
  phone1?: string
  ddd2?: string
  phone2?: string
  faxDdd?: string
  fax?: string
  email?: string
  specialSituation?: string
  specialSituationDate?: string
}

export class EstablishmentEntity extends Entity {
  private readonly _basicCnpj: string
  private readonly _cnpjOrder: string
  private readonly _cnpjDv: string
  private readonly _branchType: string
  private readonly _tradeName?: string
  private readonly _registrationStatus: string
  private readonly _registrationStatusDate?: string
  private readonly _registrationStatusReason?: string
  private readonly _foreignCityName?: string
  private readonly _countryCode?: string
  private readonly _activityStartDate?: string
  private readonly _mainCnae: string
  private readonly _secondaryCnaes?: string
  private readonly _streetType?: string
  private readonly _street?: string
  private readonly _number?: string
  private readonly _complement?: string
  private readonly _neighborhood?: string
  private readonly _zipCode?: string
  private readonly _state?: string
  private readonly _cityCode?: string
  private readonly _ddd1?: string
  private readonly _phone1?: string
  private readonly _ddd2?: string
  private readonly _phone2?: string
  private readonly _faxDdd?: string
  private readonly _fax?: string
  private readonly _email?: string
  private readonly _specialSituation?: string
  private readonly _specialSituationDate?: string

  private constructor({
    basicCnpj,
    cnpjOrder,
    cnpjDv,
    branchType,
    tradeName,
    registrationStatus,
    registrationStatusDate,
    registrationStatusReason,
    foreignCityName,
    countryCode,
    activityStartDate,
    mainCnae,
    secondaryCnaes,
    streetType,
    street,
    number,
    complement,
    neighborhood,
    zipCode,
    state,
    cityCode,
    ddd1,
    phone1,
    ddd2,
    phone2,
    faxDdd,
    fax,
    email,
    specialSituation,
    specialSituationDate,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: EstablishmentProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._basicCnpj = basicCnpj
    this._cnpjOrder = cnpjOrder
    this._cnpjDv = cnpjDv
    this._branchType = branchType
    this._tradeName = tradeName
    this._registrationStatus = registrationStatus
    this._registrationStatusDate = registrationStatusDate
    this._registrationStatusReason = registrationStatusReason
    this._foreignCityName = foreignCityName
    this._countryCode = countryCode
    this._activityStartDate = activityStartDate
    this._mainCnae = mainCnae
    this._secondaryCnaes = secondaryCnaes
    this._streetType = streetType
    this._street = street
    this._number = number
    this._complement = complement
    this._neighborhood = neighborhood
    this._zipCode = zipCode
    this._state = state
    this._cityCode = cityCode
    this._ddd1 = ddd1
    this._phone1 = phone1
    this._ddd2 = ddd2
    this._phone2 = phone2
    this._faxDdd = faxDdd
    this._fax = fax
    this._email = email
    this._specialSituation = specialSituation
    this._specialSituationDate = specialSituationDate
  }

  static reconstitute(props: EstablishmentProps): EstablishmentEntity {
    return new EstablishmentEntity(props)
  }

  static create(command: CreateEstablishmentCommand): EstablishmentEntity {
    return new EstablishmentEntity(command)
  }

  // -------------------- Getters --------------------

  get basicCnpj(): string {
    return this._basicCnpj
  }

  get cnpjOrder(): string {
    return this._cnpjOrder
  }

  get cnpjDv(): string {
    return this._cnpjDv
  }

  get fullCnpj(): string {
    return `${this._basicCnpj}${this._cnpjOrder}${this._cnpjDv}`
  }

  get branchType(): string {
    return this._branchType
  }

  get tradeName(): string | undefined {
    return this._tradeName
  }

  get registrationStatus(): string {
    return this._registrationStatus
  }

  get registrationStatusDate(): string | undefined {
    return this._registrationStatusDate
  }

  get registrationStatusReason(): string | undefined {
    return this._registrationStatusReason
  }

  get foreignCityName(): string | undefined {
    return this._foreignCityName
  }

  get countryCode(): string | undefined {
    return this._countryCode
  }

  get activityStartDate(): string | undefined {
    return this._activityStartDate
  }

  get mainCnae(): string {
    return this._mainCnae
  }

  get secondaryCnaes(): string | undefined {
    return this._secondaryCnaes
  }

  get streetType(): string | undefined {
    return this._streetType
  }

  get street(): string | undefined {
    return this._street
  }

  get number(): string | undefined {
    return this._number
  }

  get complement(): string | undefined {
    return this._complement
  }

  get neighborhood(): string | undefined {
    return this._neighborhood
  }

  get zipCode(): string | undefined {
    return this._zipCode
  }

  get state(): string | undefined {
    return this._state
  }

  get cityCode(): string | undefined {
    return this._cityCode
  }

  get ddd1(): string | undefined {
    return this._ddd1
  }

  get phone1(): string | undefined {
    return this._phone1
  }

  get ddd2(): string | undefined {
    return this._ddd2
  }

  get phone2(): string | undefined {
    return this._phone2
  }

  get faxDdd(): string | undefined {
    return this._faxDdd
  }

  get fax(): string | undefined {
    return this._fax
  }

  get email(): string | undefined {
    return this._email
  }

  get specialSituation(): string | undefined {
    return this._specialSituation
  }

  get specialSituationDate(): string | undefined {
    return this._specialSituationDate
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      basicCnpj: this._basicCnpj,
      cnpjOrder: this._cnpjOrder,
      cnpjDv: this._cnpjDv,
      fullCnpj: this.fullCnpj,
      branchType: this._branchType,
      tradeName: this._tradeName,
      registrationStatus: this._registrationStatus,
      registrationStatusDate: this._registrationStatusDate,
      registrationStatusReason: this._registrationStatusReason,
      foreignCityName: this._foreignCityName,
      countryCode: this._countryCode,
      activityStartDate: this._activityStartDate,
      mainCnae: this._mainCnae,
      secondaryCnaes: this._secondaryCnaes,
      streetType: this._streetType,
      street: this._street,
      number: this._number,
      complement: this._complement,
      neighborhood: this._neighborhood,
      zipCode: this._zipCode,
      state: this._state,
      cityCode: this._cityCode,
      ddd1: this._ddd1,
      phone1: this._phone1,
      ddd2: this._ddd2,
      phone2: this._phone2,
      faxDdd: this._faxDdd,
      fax: this._fax,
      email: this._email,
      specialSituation: this._specialSituation,
      specialSituationDate: this._specialSituationDate
    }
  }
}
