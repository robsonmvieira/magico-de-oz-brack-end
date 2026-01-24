import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type PartnerIdentifier = '1' | '2' | '3' // 1=PJ, 2=PF, 3=Estrangeiro

type CreatePartnerCommand = {
  basicCnpj: string
  partnerIdentifier?: PartnerIdentifier
  partnerName?: string
  partnerDoc?: string
  partnerQualification?: string
  entryDate?: Date
  countryCode?: string
  legalRepresentativeDoc?: string
  legalRepresentativeName?: string
  legalRepresentativeQualification?: string
  ageRange?: string
}

interface PartnerProps extends DefaultEntityProps {
  basicCnpj: string
  partnerIdentifier?: PartnerIdentifier
  partnerName?: string
  partnerDoc?: string
  partnerQualification?: string
  entryDate?: Date
  countryCode?: string
  legalRepresentativeDoc?: string
  legalRepresentativeName?: string
  legalRepresentativeQualification?: string
  ageRange?: string
}

export class PartnerEntity extends Entity {
  private readonly _basicCnpj: string
  private _partnerIdentifier?: PartnerIdentifier
  private _partnerName?: string
  private _partnerDoc?: string
  private _partnerQualification?: string
  private _entryDate?: Date
  private _countryCode?: string
  private _legalRepresentativeDoc?: string
  private _legalRepresentativeName?: string
  private _legalRepresentativeQualification?: string
  private _ageRange?: string

  private constructor({
    basicCnpj,
    partnerIdentifier,
    partnerName,
    partnerDoc,
    partnerQualification,
    entryDate,
    countryCode,
    legalRepresentativeDoc,
    legalRepresentativeName,
    legalRepresentativeQualification,
    ageRange,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: PartnerProps) {
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
    this._partnerIdentifier = partnerIdentifier
    this._partnerName = partnerName
    this._partnerDoc = partnerDoc
    this._partnerQualification = partnerQualification
    this._entryDate = entryDate
    this._countryCode = countryCode
    this._legalRepresentativeDoc = legalRepresentativeDoc
    this._legalRepresentativeName = legalRepresentativeName
    this._legalRepresentativeQualification = legalRepresentativeQualification
    this._ageRange = ageRange
  }

  static reconstitute(props: PartnerProps): PartnerEntity {
    return new PartnerEntity(props)
  }

  static create(command: CreatePartnerCommand): PartnerEntity {
    return new PartnerEntity(command)
  }

  // -------------------- Getters --------------------

  get basicCnpj(): string {
    return this._basicCnpj
  }

  get partnerIdentifier(): PartnerIdentifier | undefined {
    return this._partnerIdentifier
  }

  get partnerName(): string | undefined {
    return this._partnerName
  }

  get partnerDoc(): string | undefined {
    return this._partnerDoc
  }

  get partnerQualification(): string | undefined {
    return this._partnerQualification
  }

  get entryDate(): Date | undefined {
    return this._entryDate
  }

  get countryCode(): string | undefined {
    return this._countryCode
  }

  get legalRepresentativeDoc(): string | undefined {
    return this._legalRepresentativeDoc
  }

  get legalRepresentativeName(): string | undefined {
    return this._legalRepresentativeName
  }

  get legalRepresentativeQualification(): string | undefined {
    return this._legalRepresentativeQualification
  }

  get ageRange(): string | undefined {
    return this._ageRange
  }

  // -------------------- Domain Logic --------------------

  isPessoaJuridica(): boolean {
    return this._partnerIdentifier === '1'
  }

  isPessoaFisica(): boolean {
    return this._partnerIdentifier === '2'
  }

  isEstrangeiro(): boolean {
    return this._partnerIdentifier === '3'
  }

  hasLegalRepresentative(): boolean {
    return !!this._legalRepresentativeDoc || !!this._legalRepresentativeName
  }

  getAgeRangeDescription(): string {
    const ranges: Record<string, string> = {
      '0': 'Não se aplica',
      '1': '0 a 12 anos',
      '2': '13 a 20 anos',
      '3': '21 a 30 anos',
      '4': '31 a 40 anos',
      '5': '41 a 50 anos',
      '6': '51 a 60 anos',
      '7': '61 a 70 anos',
      '8': '71 a 80 anos',
      '9': 'Mais de 80 anos'
    }
    return ranges[this._ageRange ?? '0'] ?? 'Não informado'
  }

  getPartnerTypeDescription(): string {
    const types: Record<string, string> = {
      '1': 'Pessoa Jurídica',
      '2': 'Pessoa Física',
      '3': 'Estrangeiro'
    }
    return types[this._partnerIdentifier ?? ''] ?? 'Não informado'
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      basicCnpj: this._basicCnpj,
      partnerIdentifier: this._partnerIdentifier,
      partnerName: this._partnerName,
      partnerDoc: this._partnerDoc,
      partnerQualification: this._partnerQualification,
      entryDate: this._entryDate,
      countryCode: this._countryCode,
      legalRepresentativeDoc: this._legalRepresentativeDoc,
      legalRepresentativeName: this._legalRepresentativeName,
      legalRepresentativeQualification: this._legalRepresentativeQualification,
      ageRange: this._ageRange
    }
  }
}
