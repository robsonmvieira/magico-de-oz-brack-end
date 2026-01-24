import { Readable } from 'stream'

export interface CsvParseResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
}

export interface CsvParserOptions {
  batchSize?: number
  delimiter?: string
  skipHeader?: boolean
}

export interface ICsvParserProvider<T> {
  parseStream(
    stream: Readable,
    onBatch: (batch: T[]) => Promise<void>,
    options?: CsvParserOptions
  ): Promise<CsvParseResult>
}
