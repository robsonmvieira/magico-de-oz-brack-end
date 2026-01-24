import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB, PG_POOL } from '@modules/database'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadSchema, LeadModel } from '@modules/lead/domain/models'
import { LeadStage, LeadTemperature } from '@modules/lead/domain/enums'
import {
  SimpleModel,
  SimpleSchema
} from '@modules/lead/domain/models/simple.model'
import { Pool } from 'pg'
import { pipeline } from 'node:stream/promises'
import { from as copyFrom } from 'pg-copy-streams'

@Injectable()
export class LeadRepository
  extends DrizzleRepository<typeof LeadSchema>
  implements ILeadRepository
{
  private readonly simpleTable = SimpleSchema

  constructor(
    @Inject(DRIZZLE) db: DrizzleDB,
    @Inject(PG_POOL) private readonly pool: Pool
  ) {
    super(db, LeadSchema)
  }

  async findByMEI(mei: string): Promise<SimpleModel | null> {
    const result = await this.db
      .select()
      .from(this.simpleTable)
      .where(eq(this.simpleTable.choose_mei, mei))
      .limit(1)

    return result[0] || null
  }

  async createSimple(simple: SimpleModel): Promise<SimpleModel> {
    const result = await this.db
      .insert(this.simpleTable)
      .values(simple)
      .returning()

    return result[0]
  }

  async bulkSimple(simples: SimpleModel[]): Promise<SimpleModel[]> {
    const result = await this.db
      .insert(this.simpleTable)
      .values(simples)
      .returning()

    return result
  }

  async bulkSimpleInsert(simples: SimpleModel[]): Promise<number> {
    await this.db.insert(this.simpleTable).values(simples)
    return simples.length
  }

  async findSimpleByBasicDoc(basicDoc: string): Promise<SimpleModel | null> {
    const normalizedDoc = basicDoc.replaceAll(/\D/g, '')
    const result = await this.db
      .select()
      .from(this.simpleTable)
      .where(eq(this.simpleTable.basic_doc, normalizedDoc))
      .limit(1)

    return result[0] || null
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

  async copySimpleFromStream(stream: NodeJS.ReadableStream): Promise<number> {
    const client = await this.pool.connect()
    try {
      const copyQuery = copyFrom(
        `COPY simples (id, basic_doc, choose_simple_module, date_simple_module_start, date_exclude_simple_module_start, choose_mei, date_mei_start, date_exclude_mei_start, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
      )
      const pgStream = client.query(copyQuery)

      await pipeline(stream, pgStream)

      return pgStream.rowCount ?? 0
    } finally {
      client.release()
    }
  }
}
