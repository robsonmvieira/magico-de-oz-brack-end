import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type SimpleOptionStatus = 'N' | 'S' | 'O'

type CreateSimpleCommand = {
  basicDoc: string
  chooseSimpleModule: SimpleOptionStatus
  dateSimpleModuleStart?: Date
  dateExcludeSimpleModuleStart?: Date
  chooseMEI: SimpleOptionStatus
  dateMEIStart?: Date
  dateExcludeMEIStart?: Date
}

interface SimpleProps extends DefaultEntityProps {
  basicDoc: string
  chooseSimpleModule: SimpleOptionStatus
  dateSimpleModuleStart?: Date
  dateExcludeSimpleModuleStart?: Date
  chooseMEI: SimpleOptionStatus
  dateMEIStart?: Date
  dateExcludeMEIStart?: Date
}

export class SimpleEntity extends Entity {
  private readonly _basicDoc: string
  private _chooseSimpleModule: SimpleOptionStatus
  private _dateSimpleModuleStart?: Date
  private _dateExcludeSimpleModuleStart?: Date
  private _chooseMEI: SimpleOptionStatus
  private _dateMEIStart?: Date
  private _dateExcludeMEIStart?: Date

  private constructor({
    basicDoc,
    chooseSimpleModule,
    dateSimpleModuleStart,
    dateExcludeSimpleModuleStart,
    chooseMEI,
    dateMEIStart,
    dateExcludeMEIStart,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: SimpleProps) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._basicDoc = basicDoc
    this._chooseSimpleModule = chooseSimpleModule
    this._dateSimpleModuleStart = dateSimpleModuleStart
    this._dateExcludeSimpleModuleStart = dateExcludeSimpleModuleStart
    this._chooseMEI = chooseMEI
    this._dateMEIStart = dateMEIStart
    this._dateExcludeMEIStart = dateExcludeMEIStart
  }

  static reconstitute(props: SimpleProps): SimpleEntity {
    return new SimpleEntity(props)
  }

  static create({
    basicDoc,
    chooseSimpleModule,
    dateSimpleModuleStart,
    dateExcludeSimpleModuleStart,
    chooseMEI,
    dateMEIStart,
    dateExcludeMEIStart
  }: CreateSimpleCommand): SimpleEntity {
    return new SimpleEntity({
      basicDoc,
      chooseSimpleModule,
      dateSimpleModuleStart,
      dateExcludeSimpleModuleStart,
      chooseMEI,
      dateMEIStart,
      dateExcludeMEIStart
    })
  }

  // -------------------- Getters --------------------

  get basicDoc(): string {
    return this._basicDoc
  }

  get chooseSimpleModule(): SimpleOptionStatus {
    return this._chooseSimpleModule
  }

  get dateSimpleModuleStart(): Date | undefined {
    return this._dateSimpleModuleStart
  }

  get dateExcludeSimpleModuleStart(): Date | undefined {
    return this._dateExcludeSimpleModuleStart
  }

  get chooseMEI(): SimpleOptionStatus {
    return this._chooseMEI
  }

  get dateMEIStart(): Date | undefined {
    return this._dateMEIStart
  }

  get dateExcludeMEIStart(): Date | undefined {
    return this._dateExcludeMEIStart
  }

  // -------------------- Domain Logic --------------------

  isSimples(): boolean {
    return this._chooseSimpleModule === 'S'
  }

  isMEI(): boolean {
    return this._chooseMEI === 'S'
  }

  wasExcludedFromSimples(): boolean {
    return (
      this._chooseSimpleModule === 'N' &&
      this._dateExcludeSimpleModuleStart !== undefined
    )
  }

  wasExcludedFromMEI(): boolean {
    return this._chooseMEI === 'N' && this._dateExcludeMEIStart !== undefined
  }

  isActiveInSimples(): boolean {
    return this.isSimples() && !this._dateExcludeSimpleModuleStart
  }

  isActiveInMEI(): boolean {
    return this.isMEI() && !this._dateExcludeMEIStart
  }

  // -------------------- Behavior Methods --------------------

  updateSimpleModuleStatus(
    status: SimpleOptionStatus,
    startDate?: Date,
    excludeDate?: Date
  ): void {
    this._chooseSimpleModule = status
    this._dateSimpleModuleStart = startDate
    this._dateExcludeSimpleModuleStart = excludeDate
    this.touch()
  }

  updateMEIStatus(
    status: SimpleOptionStatus,
    startDate?: Date,
    excludeDate?: Date
  ): void {
    this._chooseMEI = status
    this._dateMEIStart = startDate
    this._dateExcludeMEIStart = excludeDate
    this.touch()
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      basicDoc: this._basicDoc,
      chooseSimpleModule: this._chooseSimpleModule,
      dateSimpleModuleStart: this._dateSimpleModuleStart,
      dateExcludeSimpleModuleStart: this._dateExcludeSimpleModuleStart,
      chooseMEI: this._chooseMEI,
      dateMEIStart: this._dateMEIStart,
      dateExcludeMEIStart: this._dateExcludeMEIStart
    }
  }
}
