import { Inject, Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB, PG_POOL } from '@modules/database'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadSchema, LeadModel } from '@modules/lead/domain/models'
import { LeadStage, LeadTemperature } from '@modules/lead/domain/enums'
import {
  SimpleModel,
  SimpleSchema
} from '@modules/lead/domain/models/simple.model'
import {
  PartnerModel,
  PartnerSchema
} from '@modules/lead/domain/models/partner.model'
import {
  CountryModel,
  CountrySchema
} from '@modules/lead/domain/models/country.model'
import {
  LegalNatureModel,
  LegalNatureSchema
} from '@modules/lead/domain/models/legal-nature.model'
import { CnaeModel, CnaeSchema } from '@modules/lead/domain/models/cnae.model'
import {
  CompanyModel,
  CompanySchema
} from '@modules/lead/domain/models/company.model'
import {
  EstablishmentModel,
  EstablishmentSchema
} from '@modules/lead/domain/models/establishment.model'
import { Pool } from 'pg'
import { pipeline } from 'node:stream/promises'
import { from as copyFrom } from 'pg-copy-streams'

@Injectable()
export class LeadRepository
  extends DrizzleRepository<typeof LeadSchema>
  implements ILeadRepository
{
  private readonly simpleTable = SimpleSchema
  private readonly partnerTable = PartnerSchema
  private readonly countryTable = CountrySchema
  private readonly legalNatureTable = LegalNatureSchema
  private readonly cnaeTable = CnaeSchema
  private readonly companyTable = CompanySchema
  private readonly establishmentTable = EstablishmentSchema

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

  // Partner methods
  async findPartnersByBasicCnpj(basicCnpj: string): Promise<PartnerModel[]> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    const result = await this.db
      .select()
      .from(this.partnerTable)
      .where(eq(this.partnerTable.basic_cnpj, normalizedCnpj))

    return result
  }

  async findPartnerByDoc(doc: string): Promise<PartnerModel | null> {
    const normalizedDoc = doc.replaceAll(/\D/g, '')
    const result = await this.db
      .select()
      .from(this.partnerTable)
      .where(eq(this.partnerTable.partner_doc, normalizedDoc))
      .limit(1)

    return result[0] || null
  }

  async createPartner(partner: PartnerModel): Promise<PartnerModel> {
    const result = await this.db
      .insert(this.partnerTable)
      .values(partner)
      .returning()

    return result[0]
  }

  async bulkPartnerInsert(partners: PartnerModel[]): Promise<number> {
    await this.db.insert(this.partnerTable).values(partners)
    return partners.length
  }

  // Country methods
  async findCountryByCode(code: string): Promise<CountryModel | null> {
    const result = await this.db
      .select()
      .from(this.countryTable)
      .where(eq(this.countryTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllCountries(): Promise<CountryModel[]> {
    const result = await this.db
      .select()
      .from(this.countryTable)
      .where(eq(this.countryTable.isDeleted, false))

    return result
  }

  async createCountry(country: CountryModel): Promise<CountryModel> {
    const result = await this.db
      .insert(this.countryTable)
      .values(country)
      .returning()

    return result[0]
  }

  async bulkCountryInsert(countries: CountryModel[]): Promise<number> {
    await this.db.insert(this.countryTable).values(countries)
    return countries.length
  }

  // Legal Nature methods
  async findLegalNatureByCode(code: string): Promise<LegalNatureModel | null> {
    const result = await this.db
      .select()
      .from(this.legalNatureTable)
      .where(eq(this.legalNatureTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllLegalNatures(): Promise<LegalNatureModel[]> {
    const result = await this.db
      .select()
      .from(this.legalNatureTable)
      .where(eq(this.legalNatureTable.isDeleted, false))

    return result
  }

  async createLegalNature(
    legalNature: LegalNatureModel
  ): Promise<LegalNatureModel> {
    const result = await this.db
      .insert(this.legalNatureTable)
      .values(legalNature)
      .returning()

    return result[0]
  }

  async bulkLegalNatureInsert(
    legalNatures: LegalNatureModel[]
  ): Promise<number> {
    await this.db.insert(this.legalNatureTable).values(legalNatures)
    return legalNatures.length
  }

  // CNAE methods
  async findCnaeByCode(code: string): Promise<CnaeModel | null> {
    const result = await this.db
      .select()
      .from(this.cnaeTable)
      .where(eq(this.cnaeTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllCnaes(): Promise<CnaeModel[]> {
    const result = await this.db
      .select()
      .from(this.cnaeTable)
      .where(eq(this.cnaeTable.isDeleted, false))

    return result
  }

  async createCnae(cnae: CnaeModel): Promise<CnaeModel> {
    const result = await this.db.insert(this.cnaeTable).values(cnae).returning()

    return result[0]
  }

  async bulkCnaeInsert(cnaes: CnaeModel[]): Promise<number> {
    await this.db.insert(this.cnaeTable).values(cnaes)
    return cnaes.length
  }

  // Company methods
  async findCompanyByBasicCnpj(
    basicCnpj: string
  ): Promise<CompanyModel | null> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    const result = await this.db
      .select()
      .from(this.companyTable)
      .where(eq(this.companyTable.basic_cnpj, normalizedCnpj))
      .limit(1)

    return result[0] || null
  }

  async findAllCompanies(): Promise<CompanyModel[]> {
    const result = await this.db
      .select()
      .from(this.companyTable)
      .where(eq(this.companyTable.isDeleted, false))

    return result
  }

  async createCompany(company: CompanyModel): Promise<CompanyModel> {
    const result = await this.db
      .insert(this.companyTable)
      .values(company)
      .returning()

    return result[0]
  }

  async bulkCompanyInsert(companies: CompanyModel[]): Promise<number> {
    await this.db.insert(this.companyTable).values(companies)
    return companies.length
  }

  // Establishment methods
  async findEstablishmentByFullCnpj(
    basicCnpj: string,
    cnpjOrder: string,
    cnpjDv: string
  ): Promise<EstablishmentModel | null> {
    const normalizedBasicCnpj = basicCnpj.replaceAll(/\D/g, '')
    const normalizedCnpjOrder = cnpjOrder.replaceAll(/\D/g, '')
    const normalizedCnpjDv = cnpjDv.replaceAll(/\D/g, '')

    const result = await this.db
      .select()
      .from(this.establishmentTable)
      .where(
        and(
          eq(this.establishmentTable.basic_cnpj, normalizedBasicCnpj),
          eq(this.establishmentTable.cnpj_order, normalizedCnpjOrder),
          eq(this.establishmentTable.cnpj_dv, normalizedCnpjDv)
        )
      )
      .limit(1)

    return result[0] || null
  }

  async findEstablishmentsByBasicCnpj(
    basicCnpj: string
  ): Promise<EstablishmentModel[]> {
    const normalizedCnpj = basicCnpj.replaceAll(/\D/g, '')
    const result = await this.db
      .select()
      .from(this.establishmentTable)
      .where(eq(this.establishmentTable.basic_cnpj, normalizedCnpj))

    return result
  }

  async findAllEstablishments(): Promise<EstablishmentModel[]> {
    const result = await this.db
      .select()
      .from(this.establishmentTable)
      .where(eq(this.establishmentTable.isDeleted, false))

    return result
  }

  async createEstablishment(
    establishment: EstablishmentModel
  ): Promise<EstablishmentModel> {
    const result = await this.db
      .insert(this.establishmentTable)
      .values(establishment)
      .returning()

    return result[0]
  }

  async bulkEstablishmentInsert(
    establishments: EstablishmentModel[]
  ): Promise<number> {
    await this.db.insert(this.establishmentTable).values(establishments)
    return establishments.length
  }
}
