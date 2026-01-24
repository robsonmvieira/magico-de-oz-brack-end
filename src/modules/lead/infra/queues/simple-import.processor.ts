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

export const SIMPLE_IMPORT_QUEUE = 'simple-import'

export interface SimpleImportJobData {
  filePath: string
  batchSize: number
  delimiter: string
  skipHeader: boolean
}

export interface SimpleImportJobResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}

@Processor(SIMPLE_IMPORT_QUEUE)
export class SimpleImportProcessor {
  private readonly logger = new Logger(SimpleImportProcessor.name)

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Process()
  async handleImport(
    job: Job<SimpleImportJobData>
  ): Promise<SimpleImportJobResult> {
    const startTime = Date.now()
    const { filePath, delimiter, skipHeader } = job.data

    this.logger.log(`Starting COPY import job ${job.id} from file: ${filePath}`)

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

    // Clean up temp file
    try {
      await unlink(filePath)
      this.logger.log(`Temp file deleted: ${filePath}`)
    } catch {
      this.logger.warn(`Failed to delete temp file: ${filePath}`)
    }

    return {
      ...result,
      durationMs
    }
  }

  private async importWithCopy(
    filePath: string,
    delimiter: string,
    skipHeader: boolean,
    job: Job<SimpleImportJobData>
  ): Promise<Omit<SimpleImportJobResult, 'durationMs'>> {
    const client = await this.pool.connect()
    const tempTableName = `simples_temp_${Date.now()}`

    try {
      // 1. Create temporary table with same structure
      this.logger.log(`Creating temporary table: ${tempTableName}`)
      await client.query(`
        CREATE TEMP TABLE ${tempTableName} (
          id UUID NOT NULL,
          basic_doc TEXT NOT NULL,
          choose_simple_module TEXT,
          date_simple_module_start TIMESTAMP,
          date_exclude_simple_module_start TIMESTAMP,
          choose_mei TEXT,
          date_mei_start TIMESTAMP,
          date_exclude_mei_start TIMESTAMP,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_blocked BOOLEAN NOT NULL DEFAULT false
        )
      `)

      // 2. COPY data into temp table (very fast, no constraints)
      this.logger.log('Starting COPY to temporary table...')
      const copyQuery = copyFrom(
        `COPY ${tempTableName} (id, basic_doc, choose_simple_module, date_simple_module_start, date_exclude_simple_module_start, choose_mei, date_mei_start, date_exclude_mei_start, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
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
      this.logger.log(`COPY completed: ${copyRowCount} rows to temp table`)

      // 3. Upsert from temp table to main table using ON CONFLICT
      this.logger.log('Starting upsert to main table...')
      const upsertResult = await client.query(`
        INSERT INTO simples (id, basic_doc, choose_simple_module, date_simple_module_start, date_exclude_simple_module_start, choose_mei, date_mei_start, date_exclude_mei_start, created_at, updated_at, is_deleted, is_active, is_blocked)
        SELECT id, basic_doc, choose_simple_module, date_simple_module_start, date_exclude_simple_module_start, choose_mei, date_mei_start, date_exclude_mei_start, created_at, updated_at, is_deleted, is_active, is_blocked
        FROM ${tempTableName}
        ON CONFLICT (basic_doc) DO UPDATE SET
          choose_simple_module = EXCLUDED.choose_simple_module,
          date_simple_module_start = EXCLUDED.date_simple_module_start,
          date_exclude_simple_module_start = EXCLUDED.date_exclude_simple_module_start,
          choose_mei = EXCLUDED.choose_mei,
          date_mei_start = EXCLUDED.date_mei_start,
          date_exclude_mei_start = EXCLUDED.date_exclude_mei_start,
          updated_at = EXCLUDED.updated_at
      `)

      const upsertRowCount = upsertResult.rowCount ?? 0
      this.logger.log(`Upsert completed: ${upsertRowCount} rows affected`)

      // 4. Drop temp table
      await client.query(`DROP TABLE IF EXISTS ${tempTableName}`)
      this.logger.log(`Temporary table ${tempTableName} dropped`)

      return {
        totalProcessed: copyRowCount,
        totalImported: upsertRowCount,
        totalErrors: 0,
        errors: []
      }
    } catch (error) {
      // Clean up temp table on error
      try {
        await client.query(`DROP TABLE IF EXISTS ${tempTableName}`)
      } catch {
        // Ignore cleanup errors
      }
      throw error
    } finally {
      client.release()
    }
  }

  private createTransformStream(
    filePath: string,
    delimiter: string,
    skipHeader: boolean,
    job: Job<SimpleImportJobData>
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
      .map(part => part.replace(/"/g, '').trim())

    if (parts.length < 4) {
      return null
    }

    const [
      basicDoc,
      dateSimpleModuleStartStr,
      dateExcludeSimpleModuleStartStr,
      chooseSimpleModule,
      dateMEIStartStr,
      dateExcludeMEIStartStr,
      chooseMEI
    ] = parts

    if (!basicDoc) {
      return null
    }

    const id = randomUUID()
    const cleanBasicDoc = basicDoc.replace(/\D/g, '')
    const chooseSimple = this.parseOptionStatus(chooseSimpleModule)
    const dateSimpleStart = this.formatDate(dateSimpleModuleStartStr)
    const dateSimpleExclude = this.formatDate(dateExcludeSimpleModuleStartStr)
    const chooseMEIValue = this.parseOptionStatus(chooseMEI)
    const dateMEIStart = this.formatDate(dateMEIStartStr)
    const dateMEIExclude = this.formatDate(dateExcludeMEIStartStr)
    const now = new Date().toISOString()

    return [
      id,
      cleanBasicDoc,
      chooseSimple,
      dateSimpleStart,
      dateSimpleExclude,
      chooseMEIValue,
      dateMEIStart,
      dateMEIExclude,
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
      return `${year}-${month}-${day}`
    }

    return dateStr
  }

  private parseOptionStatus(value: string | undefined): string {
    if (!value) return 'O'
    const upper = value.toUpperCase()
    if (['N', 'S', 'O'].includes(upper)) return upper
    return 'O'
  }

  @OnQueueCompleted()
  onCompleted(job: Job<SimpleImportJobData>, result: SimpleImportJobResult) {
    this.logger.log(
      `Job ${job.id} completed successfully: ${result.totalImported} records imported`
    )
  }

  @OnQueueFailed()
  async onFailed(job: Job<SimpleImportJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)

    try {
      await unlink(job.data.filePath)
      this.logger.log(`Temp file deleted after failure: ${job.data.filePath}`)
    } catch {
      // Ignore cleanup errors
    }
  }
}
