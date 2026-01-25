import { CompanyEntity } from '@modules/lead/domain/entities/company.entity'
import {
  CompanyModel,
  NewCompanyModel
} from '@modules/lead/domain/models/company.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface CompanyOutput {
  id: string
  basicCnpj: string
  companyName: string
  legalNatureCode: string
  responsibleQualification: string
  socialCapital: string
  companySize: string
  federativeEntity?: string
}

export class CompanyMapper {
  static toEntity(model: CompanyModel): CompanyEntity {
    return CompanyEntity.reconstitute({
      id: new UuidVO(model.id),
      basicCnpj: model.basic_cnpj,
      companyName: model.company_name,
      legalNatureCode: model.legal_nature_code,
      responsibleQualification: model.responsible_qualification,
      socialCapital: model.social_capital,
      companySize: model.company_size,
      federativeEntity: model.federative_entity ?? undefined,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: CompanyEntity): NewCompanyModel {
    return {
      id: entity.id.id,
      basic_cnpj: entity.basicCnpj,
      company_name: entity.companyName,
      legal_nature_code: entity.legalNatureCode,
      responsible_qualification: entity.responsibleQualification,
      social_capital: entity.socialCapital,
      company_size: entity.companySize,
      federative_entity: entity.federativeEntity
    }
  }

  static toOutput(model: CompanyModel): CompanyOutput {
    return {
      id: model.id,
      basicCnpj: model.basic_cnpj,
      companyName: model.company_name,
      legalNatureCode: model.legal_nature_code,
      responsibleQualification: model.responsible_qualification,
      socialCapital: model.social_capital,
      companySize: model.company_size,
      federativeEntity: model.federative_entity ?? undefined
    }
  }

  static entityToOutput(entity: CompanyEntity): CompanyOutput {
    return {
      id: entity.id.id,
      basicCnpj: entity.basicCnpj,
      companyName: entity.companyName,
      legalNatureCode: entity.legalNatureCode,
      responsibleQualification: entity.responsibleQualification,
      socialCapital: entity.socialCapital,
      companySize: entity.companySize,
      federativeEntity: entity.federativeEntity
    }
  }
}
