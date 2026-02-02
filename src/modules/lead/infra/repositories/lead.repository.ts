import { Inject, Injectable } from '@nestjs/common'
import { and, eq, ilike } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DRIZZLE, DrizzleDB, PG_POOL } from '@modules/database'
import { CnpjRawData, ILeadRepository } from '@modules/lead/domain/repositories'
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
import {
  LeadSituationChangeReasonModel,
  LeadSituationChangeReasonSchema
} from '@modules/lead/domain/models/lead-situation-change-reason.model'
import {
  MunicipalityModel,
  MunicipalitySchema
} from '@modules/lead/domain/models/municipality.model'
import {
  LeadPartnerQualificationModel,
  LeadPartnerQualificationSchema
} from '@modules/lead/domain/models/lead-partner-qualification.model'
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
  private readonly leadSituationChangeReasonTable =
    LeadSituationChangeReasonSchema
  private readonly municipalityTable = MunicipalitySchema
  private readonly leadPartnerQualificationTable =
    LeadPartnerQualificationSchema

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

  async findByCnpjRaw(cnpj: string): Promise<CnpjRawData | null> {
    const normalizedCnpj = cnpj.replaceAll(/\D/g, '')

    // Buscar estabelecimento com dados da empresa, município e país
    const establishmentResult = await this.db
      .select({
        // Identificação CNPJ
        basicCnpj: this.establishmentTable.basic_cnpj,
        cnpjOrder: this.establishmentTable.cnpj_order,
        cnpjDv: this.establishmentTable.cnpj_dv,

        // Dados da Empresa
        companyName: this.companyTable.company_name,
        legalNatureCode: this.companyTable.legal_nature_code,
        socialCapital: this.companyTable.social_capital,
        companySize: this.companyTable.company_size,

        // Dados do Estabelecimento
        tradeName: this.establishmentTable.trade_name,
        registrationStatus: this.establishmentTable.registration_status,
        activityStartDate: this.establishmentTable.activity_start_date,
        mainCnae: this.establishmentTable.main_cnae,

        // Contato
        ddd1: this.establishmentTable.ddd1,
        phone1: this.establishmentTable.phone1,
        email: this.establishmentTable.email,

        // Endereço
        streetType: this.establishmentTable.street_type,
        street: this.establishmentTable.street,
        number: this.establishmentTable.number,
        complement: this.establishmentTable.complement,
        neighborhood: this.establishmentTable.neighborhood,
        zipCode: this.establishmentTable.zip_code,
        state: this.establishmentTable.state,
        cityCode: this.establishmentTable.city_code,
        countryCode: this.establishmentTable.country_code
      })
      .from(this.establishmentTable)
      .innerJoin(
        this.companyTable,
        eq(this.companyTable.basic_cnpj, this.establishmentTable.basic_cnpj)
      )
      .where(eq(this.establishmentTable.basic_cnpj, normalizedCnpj))
      .limit(1)

    if (establishmentResult.length === 0) {
      return null
    }

    const establishment = establishmentResult[0]

    // Buscar nome do município
    let cityName: string | null = null
    if (establishment.cityCode) {
      const municipality = await this.db
        .select({ name: this.municipalityTable.name })
        .from(this.municipalityTable)
        .where(eq(this.municipalityTable.code, establishment.cityCode))
        .limit(1)

      cityName = municipality[0]?.name ?? null
    }

    // Buscar nome do país
    let countryName: string | null = null
    if (establishment.countryCode) {
      const country = await this.db
        .select({ name: this.countryTable.name })
        .from(this.countryTable)
        .where(eq(this.countryTable.code, establishment.countryCode))
        .limit(1)

      countryName = country[0]?.name ?? null
    }

    // Buscar sócios
    const partnersResult = await this.db
      .select({
        name: this.partnerTable.partner_name,
        doc: this.partnerTable.partner_doc,
        qualification: this.partnerTable.partner_qualification
      })
      .from(this.partnerTable)
      .where(eq(this.partnerTable.basic_cnpj, normalizedCnpj))

    // Montar telefone completo
    const phone =
      establishment.ddd1 && establishment.phone1
        ? `${establishment.ddd1}${establishment.phone1}`
        : null

    // Montar rua completa
    const street =
      establishment.streetType && establishment.street
        ? `${establishment.streetType} ${establishment.street}`
        : establishment.street

    return {
      basicCnpj: establishment.basicCnpj,
      cnpjOrder: establishment.cnpjOrder,
      cnpjDv: establishment.cnpjDv,
      companyName: establishment.companyName,
      legalNatureCode: establishment.legalNatureCode,
      socialCapital: establishment.socialCapital,
      companySize: establishment.companySize,
      tradeName: establishment.tradeName,
      registrationStatus: establishment.registrationStatus,
      activityStartDate: establishment.activityStartDate,
      mainCnae: establishment.mainCnae,
      phone,
      email: establishment.email,
      street,
      number: establishment.number,
      complement: establishment.complement,
      neighborhood: establishment.neighborhood,
      zipCode: establishment.zipCode,
      state: establishment.state,
      cityCode: establishment.cityCode,
      cityName,
      countryCode: establishment.countryCode,
      countryName,
      partners: partnersResult.map(p => ({
        name: p.name,
        doc: p.doc,
        qualification: p.qualification
      }))
    }
  }

  async findByCompanyNameRaw(
    companyName: string,
    limit: number = 50
  ): Promise<CnpjRawData[]> {
    // Buscar empresas pelo nome (ILIKE para busca case-insensitive parcial)
    const companiesResult = await this.db
      .select({
        basicCnpj: this.companyTable.basic_cnpj,
        companyName: this.companyTable.company_name,
        legalNatureCode: this.companyTable.legal_nature_code,
        socialCapital: this.companyTable.social_capital,
        companySize: this.companyTable.company_size
      })
      .from(this.companyTable)
      .where(ilike(this.companyTable.company_name, `%${companyName}%`))
      .limit(limit)

    if (companiesResult.length === 0) {
      return []
    }

    // Para cada empresa encontrada, buscar dados completos usando findByCnpjRaw
    const results: CnpjRawData[] = []

    for (const company of companiesResult) {
      const fullData = await this.findByCnpjRaw(company.basicCnpj)
      if (fullData) {
        results.push(fullData)
      }
    }

    return results
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

  // Lead Situation Change Reason methods
  async findLeadSituationChangeReasonByCode(
    code: string
  ): Promise<LeadSituationChangeReasonModel | null> {
    const result = await this.db
      .select()
      .from(this.leadSituationChangeReasonTable)
      .where(eq(this.leadSituationChangeReasonTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllLeadSituationChangeReasons(): Promise<
    LeadSituationChangeReasonModel[]
  > {
    const result = await this.db
      .select()
      .from(this.leadSituationChangeReasonTable)
      .where(eq(this.leadSituationChangeReasonTable.isDeleted, false))

    return result
  }

  async createLeadSituationChangeReason(
    reason: LeadSituationChangeReasonModel
  ): Promise<LeadSituationChangeReasonModel> {
    const result = await this.db
      .insert(this.leadSituationChangeReasonTable)
      .values(reason)
      .returning()

    return result[0]
  }

  async bulkLeadSituationChangeReasonInsert(
    reasons: LeadSituationChangeReasonModel[]
  ): Promise<number> {
    await this.db.insert(this.leadSituationChangeReasonTable).values(reasons)
    return reasons.length
  }

  // Municipality methods
  async findMunicipalityByCode(
    code: string
  ): Promise<MunicipalityModel | null> {
    const result = await this.db
      .select()
      .from(this.municipalityTable)
      .where(eq(this.municipalityTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllMunicipalities(): Promise<MunicipalityModel[]> {
    const result = await this.db
      .select()
      .from(this.municipalityTable)
      .where(eq(this.municipalityTable.isDeleted, false))

    return result
  }

  async createMunicipality(
    municipality: MunicipalityModel
  ): Promise<MunicipalityModel> {
    const result = await this.db
      .insert(this.municipalityTable)
      .values(municipality)
      .returning()

    return result[0]
  }

  async bulkMunicipalityInsert(
    municipalities: MunicipalityModel[]
  ): Promise<number> {
    await this.db.insert(this.municipalityTable).values(municipalities)
    return municipalities.length
  }

  // Lead Partner Qualification methods
  async findLeadPartnerQualificationByCode(
    code: string
  ): Promise<LeadPartnerQualificationModel | null> {
    const result = await this.db
      .select()
      .from(this.leadPartnerQualificationTable)
      .where(eq(this.leadPartnerQualificationTable.code, code))
      .limit(1)

    return result[0] || null
  }

  async findAllLeadPartnerQualifications(): Promise<
    LeadPartnerQualificationModel[]
  > {
    const result = await this.db
      .select()
      .from(this.leadPartnerQualificationTable)
      .where(eq(this.leadPartnerQualificationTable.isDeleted, false))

    return result
  }

  async createLeadPartnerQualification(
    qualification: LeadPartnerQualificationModel
  ): Promise<LeadPartnerQualificationModel> {
    const result = await this.db
      .insert(this.leadPartnerQualificationTable)
      .values(qualification)
      .returning()

    return result[0]
  }

  async bulkLeadPartnerQualificationInsert(
    qualifications: LeadPartnerQualificationModel[]
  ): Promise<number> {
    await this.db
      .insert(this.leadPartnerQualificationTable)
      .values(qualifications)
    return qualifications.length
  }
}
