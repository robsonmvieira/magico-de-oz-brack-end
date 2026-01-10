import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB } from '@modules/database'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadSchema, LeadModel } from '@modules/lead/domain/models'
import { LeadStage, LeadTemperature } from '@modules/lead/domain/enums'

@Injectable()
export class LeadRepository
  extends DrizzleRepository<typeof LeadSchema>
  implements ILeadRepository
{
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, LeadSchema)
  }

  async findByCompanyName(companyName: string): Promise<LeadModel | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.companyName, companyName))
      .limit(1)

    return result[0] || null
  }

  async findByEmail(email: string): Promise<LeadModel | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.email, email))
      .limit(1)

    return result[0] || null
  }

  async findByPhone(phone: string): Promise<LeadModel | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.phone, phone))
      .limit(1)

    return result[0] || null
  }

  async findByCategoryId(categoryId: string): Promise<LeadModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.leadCategoryId, categoryId))

    return result
  }

  async findByStage(stage: LeadStage): Promise<LeadModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.stage, stage))

    return result
  }

  async findByTemperature(temperature: LeadTemperature): Promise<LeadModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.temperature, temperature))

    return result
  }

  async findActive(): Promise<LeadModel[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isActive, true))

    return result
  }

  async findByGooglePlaceId(placeId: string): Promise<LeadModel | null> {
    // Busca em JSONB googleMapsData.placeId
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isDeleted, false))

    // Filtra pelo placeId no JSON
    const found = result.find(lead => lead.googleMapsData?.placeId === placeId)

    return found || null
  }

  async findByCnpj(cnpj: string): Promise<LeadModel | null> {
    // Busca em JSONB cnpjWsData.cnpj
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isDeleted, false))

    // Filtra pelo cnpj no JSON (normalizado sem pontuação)
    const normalizedCnpj = cnpj.replaceAll(/\D/g, '')
    const found = result.find(
      lead => lead.cnpjWsData?.cnpj?.replaceAll(/\D/g, '') === normalizedCnpj
    )

    return found || null
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id)
    return result !== null
  }

  async existsByCompanyName(companyName: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.companyName, companyName))
      .limit(1)

    return result.length > 0
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.email, email))
      .limit(1)

    return result.length > 0
  }
}
