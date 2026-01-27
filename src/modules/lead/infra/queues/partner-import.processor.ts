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

export const PARTNER_IMPORT_QUEUE = 'partner-import'

export interface PartnerImportJobData {
  filePath: string
  batchSize: number
  delimiter: string
  skipHeader: boolean
}

export interface PartnerImportJobResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}

@Processor(PARTNER_IMPORT_QUEUE)
export class PartnerImportProcessor {
  private readonly logger = new Logger(PartnerImportProcessor.name)

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Process()
  async handleImport(
    job: Job<PartnerImportJobData>
  ): Promise<PartnerImportJobResult> {
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
    job: Job<PartnerImportJobData>
  ): Promise<Omit<PartnerImportJobResult, 'durationMs'>> {
    const client = await this.pool.connect()

    try {
      // COPY data directly into main table (very fast)
      this.logger.log('Starting COPY directly to partners table...')
      const copyQuery = copyFrom(
        `COPY partners (id, basic_cnpj, partner_identifier, partner_name, partner_doc, partner_qualification, entry_date, country_code, legal_representative_doc, legal_representative_name, legal_representative_qualification, age_range, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
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
    job: Job<PartnerImportJobData>
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
    const parts = line
      .split(delimiter)
      .map(part => part.replaceAll('"', '').trim())

    if (parts.length < 4) {
      return null
    }

    // CSV format: CNPJ_BASICO;IDENTIFICADOR_SOCIO;NOME_SOCIO;CNPJ_CPF_SOCIO;QUALIFICACAO_SOCIO;DATA_ENTRADA;PAIS;REPRESENTANTE_LEGAL;NOME_REPRESENTANTE;QUALIFICACAO_REPRESENTANTE;FAIXA_ETARIA
    const [
      basicCnpj,
      partnerIdentifier,
      partnerName,
      partnerDoc,
      partnerQualification,
      entryDateStr,
      countryCode,
      legalRepresentativeDoc,
      legalRepresentativeName,
      legalRepresentativeQualification,
      ageRange
    ] = parts

    if (!basicCnpj) {
      return null
    }

    const id = randomUUID()
    const cleanBasicCnpj = basicCnpj.replaceAll(/\D/g, '')
    const entryDate = this.formatDate(entryDateStr)
    const now = new Date().toISOString()

    // Escape value for PostgreSQL COPY CSV format
    const escapeCsv = (val: string) =>
      val.includes(',') || val.includes('"')
        ? `"${val.replaceAll('"', '""')}"`
        : val

    return [
      id,
      cleanBasicCnpj,
      partnerIdentifier || '',
      escapeCsv(partnerName || ''),
      partnerDoc || '',
      partnerQualification || '',
      entryDate,
      countryCode || '',
      legalRepresentativeDoc || '',
      escapeCsv(legalRepresentativeName || ''),
      legalRepresentativeQualification || '',
      ageRange || '',
      now,
      now,
      'false',
      'true',
      'false'
    ].join(',')
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr || dateStr === '') return ''

    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)

      if (year === '0000' || month === '00' || day === '00') {
        return ''
      }

      return `${year}-${month}-${day}`
    }

    return dateStr
  }

  @OnQueueCompleted()
  onCompleted(job: Job<PartnerImportJobData>, result: PartnerImportJobResult) {
    this.logger.log(
      `Job ${job.id} completed successfully: ${result.totalImported} records imported`
    )
  }

  @OnQueueFailed()
  onFailed(job: Job<PartnerImportJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)
  }
}
