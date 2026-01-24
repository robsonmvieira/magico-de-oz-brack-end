import { Readable } from 'node:stream'

export interface ImportSimpleFromFileInput {
  file: Buffer | Readable
  batchSize?: number
  delimiter?: string
  skipHeader?: boolean
}
