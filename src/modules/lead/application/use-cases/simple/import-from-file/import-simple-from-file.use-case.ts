import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common'
import { Readable } from 'node:stream'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { ICsvParserProvider } from '@modules/lead/domain/services/csv-parser'
import { NewSimpleModel } from '@modules/lead/domain/models/simple.model'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { ImportSimpleFromFileInput, ImportSimpleFromFileOutput } from './dtos'

@Injectable()
export class ImportSimpleFromFileUseCase {
  private readonly logger = new Logger(ImportSimpleFromFileUseCase.name)

  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ISimpleCsvParserProvider')
  private readonly csvParser: ICsvParserProvider<NewSimpleModel>

  async execute(
    input: ImportSimpleFromFileInput
  ): Promise<ModelOutput<ImportSimpleFromFileOutput>> {
    const startTime = Date.now()

    try {
      if (!input.file) {
        return new ModelOutput<ImportSimpleFromFileOutput>({
          data: null,
          hasError: true,
          error: { file: ['file is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      this.logger.log('Starting import from uploaded file')

      const stream = this.toReadableStream(input.file)

      const result = await this.csvParser.parseStream(
        stream,
        async (batch: NewSimpleModel[]) => {
          await this.repo.bulkSimpleInsert(batch as any)
        },
        {
          batchSize: input.batchSize ?? 1000,
          delimiter: input.delimiter ?? ';',
          skipHeader: input.skipHeader ?? true
        }
      )

      const durationMs = Date.now() - startTime

      this.logger.log(
        `Import completed: ${result.totalImported} imported, ${result.totalErrors} errors, ${durationMs}ms`
      )

      return new ModelOutput<ImportSimpleFromFileOutput>({
        data: {
          totalProcessed: result.totalProcessed,
          totalImported: result.totalImported,
          totalErrors: result.totalErrors,
          errors: result.errors,
          durationMs
        },
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      this.logger.error(`Import failed: ${error.message}`)
      return new ModelOutput<ImportSimpleFromFileOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }

  private toReadableStream(file: Buffer | Readable): Readable {
    if (file instanceof Readable) {
      return file
    }
    return Readable.from(file)
  }
}
