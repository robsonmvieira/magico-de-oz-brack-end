import { IRepository } from '@modules/core/domain/repositories'
import { LeadModel, NewLeadModel } from '../models'
import { LeadStage, LeadTemperature } from '../enums'
import { SimpleModel } from '../models/simple.model'

export interface ILeadRepository extends IRepository<LeadModel, NewLeadModel> {
  // Busca por campos únicos
  findByCompanyName(companyName: string): Promise<LeadModel | null>
  findByEmail(email: string): Promise<LeadModel | null>
  findByPhone(phone: string): Promise<LeadModel | null>

  // Busca por categoria
  findByCategoryId(categoryId: string): Promise<LeadModel[]>

  // Busca por status
  findByStage(stage: LeadStage): Promise<LeadModel[]>
  findByTemperature(temperature: LeadTemperature): Promise<LeadModel[]>

  // Busca de leads ativos
  findActive(): Promise<LeadModel[]>

  // Busca por Google Place ID (evitar duplicados do Google Maps)
  findByGooglePlaceId(placeId: string): Promise<LeadModel | null>

  // Busca por CNPJ
  findByCnpj(cnpj: string): Promise<LeadModel | null>

  // Verificações de existência
  exists(id: string): Promise<boolean>
  existsByCompanyName(companyName: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>

  // simple module
  findByMEI(mei: string): Promise<SimpleModel | null>
  findSimpleByBasicDoc(basicDoc: string): Promise<SimpleModel | null>
  createSimple(simple: SimpleModel): Promise<SimpleModel>
  bulkSimple(simples: SimpleModel[]): Promise<SimpleModel[]>
}
