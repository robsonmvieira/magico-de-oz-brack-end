import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

type CreateCompanyCommand = {
  basicCnpj: string
  companyName: string
  legalNatureCode: string
  responsibleQualification: string
  socialCapital: string
  companySize: string
  federativeEntity?: string
}

interface CompanyProps extends DefaultEntityProps {
  basicCnpj: string
  companyName: string
  legalNatureCode: string
  responsibleQualification: string
  socialCapital: string
  companySize: string
  federativeEntity?: string
}

export class CompanyEntity extends Entity {
  private readonly _basicCnpj: string
  private readonly _companyName: string
  private readonly _legalNatureCode: string
  private readonly _responsibleQualification: string
  private readonly _socialCapital: string
  private readonly _companySize: string
  private readonly _federativeEntity?: string

  private constructor({
    basicCnpj,
    companyName,
    legalNatureCode,
    responsibleQualification,
    socialCapital,
    companySize,
    federativeEntity,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: CompanyProps) {
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
    this._companyName = companyName
    this._legalNatureCode = legalNatureCode
    this._responsibleQualification = responsibleQualification
    this._socialCapital = socialCapital
    this._companySize = companySize
    this._federativeEntity = federativeEntity
  }

  static reconstitute(props: CompanyProps): CompanyEntity {
    return new CompanyEntity(props)
  }

  static create(command: CreateCompanyCommand): CompanyEntity {
    return new CompanyEntity(command)
  }

  // -------------------- Getters --------------------

  get basicCnpj(): string {
    return this._basicCnpj
  }

  get companyName(): string {
    return this._companyName
  }

  get legalNatureCode(): string {
    return this._legalNatureCode
  }

  get responsibleQualification(): string {
    return this._responsibleQualification
  }

  get socialCapital(): string {
    return this._socialCapital
  }

  get companySize(): string {
    return this._companySize
  }

  get federativeEntity(): string | undefined {
    return this._federativeEntity
  }

  // -------------------- Abstract Implementations --------------------

  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      basicCnpj: this._basicCnpj,
      companyName: this._companyName,
      legalNatureCode: this._legalNatureCode,
      responsibleQualification: this._responsibleQualification,
      socialCapital: this._socialCapital,
      companySize: this._companySize,
      federativeEntity: this._federativeEntity
    }
  }
}
/* 
 part 00 - K3241.K03200Y0.D60110.EMPRECSV uploaded -> in progress -> completed
 part 01 - K3241.K03200Y1.D60110.EMPRECSV  uploaded -> in progress -> completed
 part 02 - K3241.K03200Y2.D60110.EMPRECSV  uploaded -> in progress -> completed
 part 03 - K3241.K03200Y3.D60110.EMPRECSV  uploaded -> in progress -> completed
 part 04 - K3241.K03200Y4.D60110.EMPRECSV  uploaded -> in progress
*/
