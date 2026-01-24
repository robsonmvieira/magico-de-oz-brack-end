export class ImportSimpleFromFileOutput {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}
