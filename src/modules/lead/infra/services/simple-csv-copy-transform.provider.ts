import { Injectable, Logger } from '@nestjs/common'
import { createInterface } from 'node:readline'
import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'

/**
 * Transform stream that converts the Simple Nacional CSV format
 * to PostgreSQL COPY format for high-performance bulk inserts.
 *
 * Input format: "basicDoc";"dateSimpleStart";"dateSimpleExclude";"chooseSimple";"dateMEIStart";"dateMEIExclude";"chooseMEI"
 * Output format: CSV compatible with COPY command
 */
@Injectable()
export class SimpleCsvCopyTransformProvider {
  private readonly logger = new Logger(SimpleCsvCopyTransformProvider.name)

  async *transformLines(
    filePath: string,
    delimiter: string = ';',
    skipHeader: boolean = true
  ): AsyncGenerator<string, void, unknown> {
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' })
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    let isFirstLine = true
    let lineNumber = 0

    for await (const line of rl) {
      lineNumber++

      if (isFirstLine && skipHeader) {
        isFirstLine = false
        continue
      }
      isFirstLine = false

      if (!line.trim()) continue

      try {
        const csvLine = this.transformLine(line, delimiter)
        if (csvLine) {
          yield csvLine + '\n'
        }
      } catch (error) {
        this.logger.warn(`Error parsing line ${lineNumber}: ${error.message}`)
      }
    }
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

    // Format: id,basic_doc,choose_simple_module,date_simple_module_start,date_exclude_simple_module_start,choose_mei,date_mei_start,date_exclude_mei_start,created_at,updated_at,is_deleted,is_active,is_blocked
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

    // Format: YYYYMMDD
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
}
