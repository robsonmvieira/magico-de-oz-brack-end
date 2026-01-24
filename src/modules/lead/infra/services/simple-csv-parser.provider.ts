import { Injectable, Logger } from '@nestjs/common'
import { Readable } from 'node:stream'
import { createInterface } from 'node:readline'
import {
  ICsvParserProvider,
  CsvParseResult,
  CsvParserOptions
} from '@modules/lead/domain/services/csv-parser'
import { NewSimpleModel } from '@modules/lead/domain/models/simple.model'
import { randomUUID } from 'node:crypto'

type SimpleOptionStatus = 'N' | 'S' | 'O'

export interface SimpleCsvRow {
  basicDoc: string
  chooseSimpleModule: SimpleOptionStatus
  dateSimpleModuleStart?: Date
  dateExcludeSimpleModuleStart?: Date
  chooseMEI: SimpleOptionStatus
  dateMEIStart?: Date
  dateExcludeMEIStart?: Date
}

@Injectable()
export class SimpleCsvParserProvider implements ICsvParserProvider<NewSimpleModel> {
  private readonly logger = new Logger(SimpleCsvParserProvider.name)

  async parseStream(
    stream: Readable,
    onBatch: (batch: NewSimpleModel[]) => Promise<void>,
    options: CsvParserOptions = {}
  ): Promise<CsvParseResult> {
    const { batchSize = 1000, delimiter = ';', skipHeader = true } = options

    const result: CsvParseResult = {
      totalProcessed: 0,
      totalImported: 0,
      totalErrors: 0,
      errors: []
    }

    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity
    })

    let batch: NewSimpleModel[] = []
    let lineNumber = 0
    let isFirstLine = true

    for await (const line of rl) {
      lineNumber++

      if (isFirstLine && skipHeader) {
        isFirstLine = false
        continue
      }
      isFirstLine = false

      if (!line.trim()) continue

      try {
        const parsed = this.parseLine(line, delimiter)
        if (parsed) {
          batch.push(parsed)
          result.totalProcessed++
        }
      } catch (error) {
        result.totalErrors++
        if (result.errors.length < 100) {
          result.errors.push({
            line: lineNumber,
            error: error.message
          })
        }
        continue
      }

      if (batch.length >= batchSize) {
        try {
          await onBatch(batch)
          result.totalImported += batch.length
          this.logger.log(
            `Processed batch: ${result.totalImported} records imported`
          )
        } catch (error) {
          result.totalErrors += batch.length
          this.logger.error(`Batch insert failed: ${error.message}`)
        }
        batch = []
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      try {
        await onBatch(batch)
        result.totalImported += batch.length
        this.logger.log(
          `Final batch processed: ${result.totalImported} total records imported`
        )
      } catch (error) {
        result.totalErrors += batch.length
        this.logger.error(`Final batch insert failed: ${error.message}`)
      }
    }

    return result
  }

  private parseLine(line: string, delimiter: string): NewSimpleModel | null {
    // Expected format: "basicDoc";"dateSimpleStart";"dateSimpleExclude";"chooseSimple";"dateMEIStart";"dateMEIExclude";"chooseMEI"
    // Example: "33581424";"20190509";"20220401";"N";"20190509";"20220401";"N"
    const parts = line
      .split(delimiter)
      .map(part => part.replace(/"/g, '').trim())

    if (parts.length < 4) {
      throw new Error(`Invalid line format: expected at least 4 columns`)
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
      throw new Error('basicDoc is required')
    }

    return {
      id: randomUUID(),
      basic_doc: basicDoc.replace(/\D/g, ''),
      choose_simple_module: this.parseOptionStatus(chooseSimpleModule),
      date_simple_module_start: this.parseDate(dateSimpleModuleStartStr),
      date_exclude_simple_module_start: this.parseDate(
        dateExcludeSimpleModuleStartStr
      ),
      choose_mei: this.parseOptionStatus(chooseMEI),
      date_mei_start: this.parseDate(dateMEIStartStr),
      date_exclude_mei_start: this.parseDate(dateExcludeMEIStartStr)
    }
  }

  private parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr === '') return null

    // Format: YYYYMMDD
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const date = new Date(year, month, day)

      if (isNaN(date.getTime())) return null
      return date
    }

    // Try ISO format
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date
  }

  private parseOptionStatus(value: string | undefined): string | null {
    if (!value) return 'O'
    const upper = value.toUpperCase()
    if (['N', 'S', 'O'].includes(upper)) return upper
    return 'O'
  }
}
