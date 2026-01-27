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

export const COMPANY_IMPORT_QUEUE = 'company-import'

export interface CompanyImportJobData {
  filePath: string
  batchSize: number
  delimiter: string
  skipHeader: boolean
}

export interface CompanyImportJobResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}

@Processor(COMPANY_IMPORT_QUEUE)
export class CompanyImportProcessor {
  private readonly logger = new Logger(CompanyImportProcessor.name)

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Process()
  async handleImport(
    job: Job<CompanyImportJobData>
  ): Promise<CompanyImportJobResult> {
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
    job: Job<CompanyImportJobData>
  ): Promise<Omit<CompanyImportJobResult, 'durationMs'>> {
    const client = await this.pool.connect()

    try {
      this.logger.log('Starting COPY directly to companies table...')
      const copyQuery = copyFrom(
        `COPY companies (id, basic_cnpj, company_name, legal_nature_code, responsible_qualification, social_capital, company_size, federative_entity, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
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
    job: Job<CompanyImportJobData>
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

    if (parts.length < 6) {
      return null
    }

    // CSV format from CNPJ open data (EMPRESAS):
    // "CNPJ_BASICO";"RAZAO_SOCIAL";"NATUREZA_JURIDICA";"QUALIFICACAO_RESPONSAVEL";"CAPITAL_SOCIAL";"PORTE_EMPRESA";"ENTE_FEDERATIVO"
    // Example: "22967229";"ALESSANDRO M ABATE CURSOS E TREINAMENTOS EM JORNALISMO";"2135";"50";"2000,00";"01";""
    const [
      basicCnpj,
      companyName,
      legalNatureCode,
      responsibleQualification,
      socialCapital,
      companySize,
      federativeEntity
    ] = parts

    if (!basicCnpj || !companyName) {
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

    // Convert Brazilian decimal format (2000,00) to standard format (2000.00)
    const normalizedSocialCapital = (socialCapital || '0').replaceAll(',', '.')

    return [
      id,
      basicCnpj,
      escapeCsvValue(companyName),
      legalNatureCode || '',
      responsibleQualification || '',
      normalizedSocialCapital,
      companySize || '00',
      escapeCsvValue(federativeEntity || ''),
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
  onCompleted(job: Job<CompanyImportJobData>, result: CompanyImportJobResult) {
    this.logger.log(
      `Job ${job.id} completed successfully: ${result.totalImported} records imported`
    )
  }

  @OnQueueFailed()
  onFailed(job: Job<CompanyImportJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)
  }
}
