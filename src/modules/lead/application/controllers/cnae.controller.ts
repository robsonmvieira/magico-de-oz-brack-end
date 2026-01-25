import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  Inject,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { Response } from 'express'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger'
import { FindCnaeByCodeUseCase } from '../use-cases/cnae'
import { ImportCnaeOptionsDto } from './dtos'
import {
  CNAE_IMPORT_QUEUE,
  CnaeImportJobData
} from '@modules/lead/infra/queues'

const csvStorage = diskStorage({
  destination: tmpdir(),
  filename: (_req, file, cb) => {
    const uniqueName = `cnae-import-${randomUUID()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

@ApiTags('CNAEs (Classificação Nacional de Atividades Econômicas)')
@Controller('cnae')
export class CnaeController {
  constructor(
    @InjectQueue(CNAE_IMPORT_QUEUE)
    private readonly importQueue: Queue<CnaeImportJobData>
  ) {}

  @Inject(FindCnaeByCodeUseCase)
  private readonly findByCodeUseCase: FindCnaeByCodeUseCase

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: csvStorage }))
  @ApiOperation({
    summary: 'Import CNAE data from CSV file (async)',
    description:
      'Queues an import job for CNAE (Classificação Nacional de Atividades Econômicas) data from a CSV file. Returns a job ID to track progress.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to import'
        },
        batchSize: { type: 'number', example: 1000 },
        delimiter: { type: 'string', example: ';' },
        skipHeader: { type: 'boolean', example: false }
      },
      required: ['file']
    }
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Import job queued successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', example: '123' },
        message: { type: 'string', example: 'Import job queued successfully' },
        statusUrl: {
          type: 'string',
          example: '/api/cnae/import/status/123'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input - file is required'
  })
  async importFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ImportCnaeOptionsDto,
    @Res() res: Response
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    const job = await this.importQueue.add({
      filePath: file.path,
      batchSize: options.batchSize ?? 1000,
      delimiter: options.delimiter ?? ';',
      skipHeader: options.skipHeader ?? false
    })

    return res.status(HttpStatus.ACCEPTED).json({
      jobId: job.id,
      message: 'Import job queued successfully',
      statusUrl: `/api/cnae/import/status/${job.id}`
    })
  }

  @Get('import/status/:jobId')
  @ApiOperation({
    summary: 'Get import job status',
    description: 'Returns the current status and progress of an import job'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['waiting', 'active', 'completed', 'failed', 'delayed']
        },
        progress: { type: 'number', example: 50 },
        result: {
          type: 'object',
          properties: {
            totalProcessed: { type: 'number' },
            totalImported: { type: 'number' },
            totalErrors: { type: 'number' },
            durationMs: { type: 'number' }
          }
        },
        error: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found'
  })
  async getImportStatus(@Param('jobId') jobId: string, @Res() res: Response) {
    const job = await this.importQueue.getJob(jobId)

    if (!job) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'Job not found'
      })
    }

    const state = await job.getState()
    const progress = job.progress()
    const result = job.returnvalue
    const failedReason = job.failedReason

    return res.status(HttpStatus.OK).json({
      jobId: job.id,
      status: state,
      progress,
      result: state === 'completed' ? result : null,
      error: state === 'failed' ? failedReason : null
    })
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Find CNAE by code',
    description: 'Returns a CNAE by its code'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CNAE data retrieved successfully'
  })
  async findByCode(@Param('code') code: string, @Res() res: Response) {
    const result = await this.findByCodeUseCase.execute(code)
    return res.status(result.statusCode).json(result)
  }
}
