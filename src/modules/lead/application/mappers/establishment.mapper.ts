import { EstablishmentEntity } from '@modules/lead/domain/entities/establishment.entity'
import {
  EstablishmentModel,
  NewEstablishmentModel
} from '@modules/lead/domain/models/establishment.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface EstablishmentOutput {
  id: string
  basicCnpj: string
  cnpjOrder: string
  cnpjDv: string
  fullCnpj: string
  branchType: string
  tradeName: string | null
  registrationStatus: string
  registrationStatusDate: string | null
  registrationStatusReason: string | null
  foreignCityName: string | null
  countryCode: string | null
  activityStartDate: string | null
  mainCnae: string
  secondaryCnaes: string | null
  streetType: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  zipCode: string | null
  state: string | null
  cityCode: string | null
  ddd1: string | null
  phone1: string | null
  ddd2: string | null
  phone2: string | null
  faxDdd: string | null
  fax: string | null
  email: string | null
  specialSituation: string | null
  specialSituationDate: string | null
}

export class EstablishmentMapper {
  static toEntity(model: EstablishmentModel): EstablishmentEntity {
    return EstablishmentEntity.reconstitute({
      id: new UuidVO(model.id),
      basicCnpj: model.basic_cnpj,
      cnpjOrder: model.cnpj_order,
      cnpjDv: model.cnpj_dv,
      branchType: model.branch_type,
      tradeName: model.trade_name ?? undefined,
      registrationStatus: model.registration_status,
      registrationStatusDate: model.registration_status_date ?? undefined,
      registrationStatusReason: model.registration_status_reason ?? undefined,
      foreignCityName: model.foreign_city_name ?? undefined,
      countryCode: model.country_code ?? undefined,
      activityStartDate: model.activity_start_date ?? undefined,
      mainCnae: model.main_cnae,
      secondaryCnaes: model.secondary_cnaes ?? undefined,
      streetType: model.street_type ?? undefined,
      street: model.street ?? undefined,
      number: model.number ?? undefined,
      complement: model.complement ?? undefined,
      neighborhood: model.neighborhood ?? undefined,
      zipCode: model.zip_code ?? undefined,
      state: model.state ?? undefined,
      cityCode: model.city_code ?? undefined,
      ddd1: model.ddd1 ?? undefined,
      phone1: model.phone1 ?? undefined,
      ddd2: model.ddd2 ?? undefined,
      phone2: model.phone2 ?? undefined,
      faxDdd: model.fax_ddd ?? undefined,
      fax: model.fax ?? undefined,
      email: model.email ?? undefined,
      specialSituation: model.special_situation ?? undefined,
      specialSituationDate: model.special_situation_date ?? undefined,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: EstablishmentEntity): NewEstablishmentModel {
    return {
      id: entity.id.id,
      basic_cnpj: entity.basicCnpj,
      cnpj_order: entity.cnpjOrder,
      cnpj_dv: entity.cnpjDv,
      branch_type: entity.branchType,
      trade_name: entity.tradeName ?? null,
      registration_status: entity.registrationStatus,
      registration_status_date: entity.registrationStatusDate ?? null,
      registration_status_reason: entity.registrationStatusReason ?? null,
      foreign_city_name: entity.foreignCityName ?? null,
      country_code: entity.countryCode ?? null,
      activity_start_date: entity.activityStartDate ?? null,
      main_cnae: entity.mainCnae,
      secondary_cnaes: entity.secondaryCnaes ?? null,
      street_type: entity.streetType ?? null,
      street: entity.street ?? null,
      number: entity.number ?? null,
      complement: entity.complement ?? null,
      neighborhood: entity.neighborhood ?? null,
      zip_code: entity.zipCode ?? null,
      state: entity.state ?? null,
      city_code: entity.cityCode ?? null,
      ddd1: entity.ddd1 ?? null,
      phone1: entity.phone1 ?? null,
      ddd2: entity.ddd2 ?? null,
      phone2: entity.phone2 ?? null,
      fax_ddd: entity.faxDdd ?? null,
      fax: entity.fax ?? null,
      email: entity.email ?? null,
      special_situation: entity.specialSituation ?? null,
      special_situation_date: entity.specialSituationDate ?? null
    }
  }

  static toOutput(model: EstablishmentModel): EstablishmentOutput {
    return {
      id: model.id,
      basicCnpj: model.basic_cnpj,
      cnpjOrder: model.cnpj_order,
      cnpjDv: model.cnpj_dv,
      fullCnpj: `${model.basic_cnpj}${model.cnpj_order}${model.cnpj_dv}`,
      branchType: model.branch_type,
      tradeName: model.trade_name,
      registrationStatus: model.registration_status,
      registrationStatusDate: model.registration_status_date,
      registrationStatusReason: model.registration_status_reason,
      foreignCityName: model.foreign_city_name,
      countryCode: model.country_code,
      activityStartDate: model.activity_start_date,
      mainCnae: model.main_cnae,
      secondaryCnaes: model.secondary_cnaes,
      streetType: model.street_type,
      street: model.street,
      number: model.number,
      complement: model.complement,
      neighborhood: model.neighborhood,
      zipCode: model.zip_code,
      state: model.state,
      cityCode: model.city_code,
      ddd1: model.ddd1,
      phone1: model.phone1,
      ddd2: model.ddd2,
      phone2: model.phone2,
      faxDdd: model.fax_ddd,
      fax: model.fax,
      email: model.email,
      specialSituation: model.special_situation,
      specialSituationDate: model.special_situation_date
    }
  }

  static entityToOutput(entity: EstablishmentEntity): EstablishmentOutput {
    return {
      id: entity.id.id,
      basicCnpj: entity.basicCnpj,
      cnpjOrder: entity.cnpjOrder,
      cnpjDv: entity.cnpjDv,
      fullCnpj: entity.fullCnpj,
      branchType: entity.branchType,
      tradeName: entity.tradeName ?? null,
      registrationStatus: entity.registrationStatus,
      registrationStatusDate: entity.registrationStatusDate ?? null,
      registrationStatusReason: entity.registrationStatusReason ?? null,
      foreignCityName: entity.foreignCityName ?? null,
      countryCode: entity.countryCode ?? null,
      activityStartDate: entity.activityStartDate ?? null,
      mainCnae: entity.mainCnae,
      secondaryCnaes: entity.secondaryCnaes ?? null,
      streetType: entity.streetType ?? null,
      street: entity.street ?? null,
      number: entity.number ?? null,
      complement: entity.complement ?? null,
      neighborhood: entity.neighborhood ?? null,
      zipCode: entity.zipCode ?? null,
      state: entity.state ?? null,
      cityCode: entity.cityCode ?? null,
      ddd1: entity.ddd1 ?? null,
      phone1: entity.phone1 ?? null,
      ddd2: entity.ddd2 ?? null,
      phone2: entity.phone2 ?? null,
      faxDdd: entity.faxDdd ?? null,
      fax: entity.fax ?? null,
      email: entity.email ?? null,
      specialSituation: entity.specialSituation ?? null,
      specialSituationDate: entity.specialSituationDate ?? null
    }
  }
}
