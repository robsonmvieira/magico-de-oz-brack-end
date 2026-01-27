import {
  Process,
  Processor,
  OnQueueCompleted,
  OnQueueFailed
} from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bull'
import { createReadStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'
import { PG_POOL } from '@modules/database'

export const ESTABLISHMENT_IMPORT_QUEUE = 'establishment-import'

export interface EstablishmentImportJobData {
  filePath: string
  batchSize: number
  delimiter: string
  skipHeader: boolean
}

export interface EstablishmentImportJobResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}

@Processor(ESTABLISHMENT_IMPORT_QUEUE)
export class EstablishmentImportProcessor {
  private readonly logger = new Logger(EstablishmentImportProcessor.name)

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Process()
  async handleImport(
    job: Job<EstablishmentImportJobData>
  ): Promise<EstablishmentImportJobResult> {
    const startTime = Date.now()
    const { filePath, delimiter, skipHeader } = job.data

    this.logger.log(`Starting COPY import job ${job.id} from file: ${filePath}`)

    try {
      const result = await this.importWithCopy(
        filePath,
        delimiter,
        skipHeader,
        job
      )

      const durationMs = Date.now() - startTime

      this.logger.log(
        `Job ${job.id} completed: ${result.totalImported} imported, ${result.totalErrors} errors, ${durationMs}ms`
      )

      return {
        ...result,
        durationMs
      }
    } finally {
      try {
        await unlink(filePath)
        this.logger.log(`Temp file deleted: ${filePath}`)
      } catch {
        this.logger.warn(`Failed to delete temp file: ${filePath}`)
      }
    }
  }

  private async importWithCopy(
    filePath: string,
    delimiter: string,
    skipHeader: boolean,
    job: Job<EstablishmentImportJobData>
  ): Promise<Omit<EstablishmentImportJobResult, 'durationMs'>> {
    const client = await this.pool.connect()

    try {
      this.logger.log('Starting COPY directly to establishments table...')
      const copyQuery = copyFrom(
        `COPY establishments (id, basic_cnpj, cnpj_order, cnpj_dv, branch_type, trade_name, registration_status, registration_status_date, registration_status_reason, foreign_city_name, country_code, activity_start_date, main_cnae, secondary_cnaes, street_type, street, number, complement, neighborhood, zip_code, state, city_code, ddd1, phone1, ddd2, phone2, fax_ddd, fax, email, special_situation, special_situation_date, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
      )
      const pgStream = client.query(copyQuery)

      const transformedStream = this.createTransformStream(
        filePath,
        delimiter,
        skipHeader,
        job
      )

      await pipeline(transformedStream, pgStream)

      const copyRowCount = pgStream.rowCount ?? 0
      this.logger.log(`COPY completed: ${copyRowCount} rows inserted`)

      return {
        totalProcessed: copyRowCount,
        totalImported: copyRowCount,
        totalErrors: 0,
        errors: []
      }
    } finally {
      client.release()
    }
  }

  private createTransformStream(
    filePath: string,
    delimiter: string,
    skipHeader: boolean,
    job: Job<EstablishmentImportJobData>
  ): Readable {
    let isFirstLine = true
    let processedCount = 0

    const generateLines = async function* (
      transformLine: (line: string, delimiter: string) => string | null,
      logger: { log: (msg: string) => void; warn: (msg: string) => void }
    ) {
      const fileStream = createReadStream(filePath, { encoding: 'utf-8' })
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      })

      for await (const line of rl) {
        if (isFirstLine && skipHeader) {
          isFirstLine = false
          continue
        }
        isFirstLine = false

        if (!line.trim()) continue

        try {
          const csvLine = transformLine(line, delimiter)
          if (csvLine) {
            processedCount++
            if (processedCount % 100000 === 0) {
              await job.progress(processedCount)
              logger.log(`Progress: ${processedCount} records processed`)
            }
            yield csvLine + '\n'
          }
        } catch (error) {
          logger.warn(`Error parsing line: ${error.message}`)
        }
      }
    }

    return Readable.from(
      generateLines(this.transformLine.bind(this), this.logger)
    )
  }

  private transformLine(line: string, delimiter: string): string | null {
    // Parse CSV respecting quoted fields that may contain the delimiter
    const parts = this.parseCsvLine(line, delimiter)

    if (parts.length < 12) {
      return null
    }

    // CSV format from CNPJ open data (ESTABELECIMENTOS):
    // Position 0: CNPJ_BASICO (8 digits)
    // Position 1: CNPJ_ORDEM (4 digits)
    // Position 2: CNPJ_DV (2 digits - check digit)
    // Position 3: IDENTIFICADOR_MATRIZ_FILIAL (1=MATRIZ, 2=FILIAL)
    // Position 4: NOME_FANTASIA
    // Position 5: SITUACAO_CADASTRAL (01=NULA, 2=ATIVA, 3=SUSPENSA, 4=INAPTA, 08=BAIXADA)
    // Position 6: DATA_SITUACAO_CADASTRAL
    // Position 7: MOTIVO_SITUACAO_CADASTRAL
    // Position 8: NOME_CIDADE_EXTERIOR
    // Position 9: PAIS (country code)
    // Position 10: DATA_INICIO_ATIVIDADE
    // Position 11: CNAE_FISCAL_PRINCIPAL
    // Position 12: CNAE_FISCAL_SECUNDARIA (comma-separated)
    // Position 13: TIPO_LOGRADOURO
    // Position 14: LOGRADOURO
    // Position 15: NUMERO
    // Position 16: COMPLEMENTO
    // Position 17: BAIRRO
    // Position 18: CEP
    // Position 19: UF
    // Position 20: MUNICIPIO (code)
    // Position 21: DDD1
    // Position 22: TELEFONE1
    // Position 23: DDD2
    // Position 24: TELEFONE2
    // Position 25: DDD_FAX
    // Position 26: FAX
    // Position 27: CORREIO_ELETRONICO (email)
    // Position 28: SITUACAO_ESPECIAL
    // Position 29: DATA_SITUACAO_ESPECIAL

    const [
      basicCnpj,
      cnpjOrder,
      cnpjDv,
      branchType,
      tradeName,
      registrationStatus,
      registrationStatusDate,
      registrationStatusReason,
      foreignCityName,
      countryCode,
      activityStartDate,
      mainCnae,
      secondaryCnaes,
      streetType,
      street,
      number,
      complement,
      neighborhood,
      zipCode,
      state,
      cityCode,
      ddd1,
      phone1,
      ddd2,
      phone2,
      faxDdd,
      fax,
      email,
      specialSituation,
      specialSituationDate
    ] = parts

    if (!basicCnpj || !cnpjOrder || !cnpjDv || !mainCnae) {
      return null
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    // Escape CSV values that might contain commas
    const escapeCsvValue = (value: string): string => {
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replaceAll('"', '""')}"`
      }
      return value
    }

    return [
      id,
      basicCnpj,
      cnpjOrder,
      cnpjDv,
      branchType || '1',
      escapeCsvValue(tradeName || ''),
      registrationStatus || '2',
      registrationStatusDate || '',
      registrationStatusReason || '',
      escapeCsvValue(foreignCityName || ''),
      countryCode || '',
      activityStartDate || '',
      mainCnae,
      escapeCsvValue(secondaryCnaes || ''),
      escapeCsvValue(streetType || ''),
      escapeCsvValue(street || ''),
      escapeCsvValue(number || ''),
      escapeCsvValue(complement || ''),
      escapeCsvValue(neighborhood || ''),
      zipCode || '',
      state || '',
      cityCode || '',
      ddd1 || '',
      phone1 || '',
      ddd2 || '',
      phone2 || '',
      faxDdd || '',
      fax || '',
      escapeCsvValue(email || '').toLowerCase(),
      escapeCsvValue(specialSituation || ''),
      specialSituationDate || '',
      now,
      now,
      'false',
      'true',
      'false'
    ].join(',')
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  @OnQueueCompleted()
  onCompleted(
    job: Job<EstablishmentImportJobData>,
    result: EstablishmentImportJobResult
  ) {
    this.logger.log(
      `Job ${job.id} completed successfully: ${result.totalImported} records imported`
    )
  }

  @OnQueueFailed()
  onFailed(job: Job<EstablishmentImportJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)
  }
}
