# Guia de Criacao de Entidades - Fluxo Completo

Este documento descreve o passo a passo para criar uma nova entidade no sistema, seguindo a arquitetura Clean Architecture com Domain-Driven Design (DDD).

## Indice

1. [Visao Geral da Arquitetura](#visao-geral-da-arquitetura)
2. [Estrutura de Diretorios](#estrutura-de-diretorios)
3. [Passo 1: Criar a Entidade de Dominio](#passo-1-criar-a-entidade-de-dominio)
4. [Passo 2: Criar o Model (Schema Drizzle)](#passo-2-criar-o-model-schema-drizzle)
5. [Passo 3: Criar a Migration](#passo-3-criar-a-migration)
6. [Passo 4: Atualizar o Contrato do Repositorio](#passo-4-atualizar-o-contrato-do-repositorio)
7. [Passo 5: Implementar os Metodos no Repositorio](#passo-5-implementar-os-metodos-no-repositorio)
8. [Passo 6: Criar o Mapper](#passo-6-criar-o-mapper)
9. [Passo 7: Criar os Use Cases](#passo-7-criar-os-use-cases)
10. [Passo 8: Criar o Import Processor (Bull Queue)](#passo-8-criar-o-import-processor-bull-queue)
11. [Passo 9: Criar o Controller](#passo-9-criar-o-controller)
12. [Passo 10: Criar o Provider](#passo-10-criar-o-provider)
13. [Passo 11: Integrar no Modulo](#passo-11-integrar-no-modulo)
14. [Passo 12: Criar Testes Unitarios](#passo-12-criar-testes-unitarios)
15. [Passo 13: Criar Testes de Integracao](#passo-13-criar-testes-de-integracao)
16. [Passo 14: Atualizar Mocks de Teste](#passo-14-atualizar-mocks-de-teste)
17. [Checklist Final](#checklist-final)
18. [Comandos Uteis](#comandos-uteis)

---

## Visao Geral da Arquitetura

```
src/modules/lead/
├── domain/                    # Camada de Dominio
│   ├── entities/              # Entidades de dominio
│   ├── models/                # Schemas Drizzle (banco de dados)
│   └── repositories/          # Contratos de repositorios
├── application/               # Camada de Aplicacao
│   ├── controllers/           # Controllers REST
│   │   └── dtos/              # DTOs de entrada
│   ├── mappers/               # Mapeadores Entity <-> Model <-> Output
│   └── use-cases/             # Casos de uso
│       └── {entity}/
│           └── {action}/
│               └── dtos/      # DTOs de saida
└── infra/                     # Camada de Infraestrutura
    ├── providers/             # Providers NestJS
    ├── queues/                # Processadores Bull Queue
    └── repositories/          # Implementacoes de repositorios
```

---

## Estrutura de Diretorios

Para uma entidade chamada `{entity}`, crie os seguintes arquivos:

```
# Domain Layer
src/modules/lead/domain/entities/{entity}.entity.ts
src/modules/lead/domain/models/{entity}.model.ts

# Application Layer
src/modules/lead/application/mappers/{entity}.mapper.ts
src/modules/lead/application/use-cases/{entity}/index.ts
src/modules/lead/application/use-cases/{entity}/find-by-{field}/
src/modules/lead/application/controllers/{entity}.controller.ts
src/modules/lead/application/controllers/dtos/import-{entity}.dto.ts

# Infrastructure Layer
src/modules/lead/infra/providers/{entity}.provider.ts
src/modules/lead/infra/queues/{entity}-import.processor.ts

# Database
drizzle/XXXX_{entity}.sql

# Tests
tests/modules/lead/infra/queues/{entity}-import.processor.spec.ts
tests/modules/lead/infra/queues/{entity}-import.processor.integration.spec.ts
```

---

## Passo 1: Criar a Entidade de Dominio

**Arquivo:** `src/modules/lead/domain/entities/{entity}.entity.ts`

```typescript
import { ValueObject } from '@modules/core/domain/valueObject'
import { DefaultEntityProps, Entity } from '@modules/core/domain/entities'

// Comando para criar a entidade
type Create{Entity}Command = {
  field1: string
  field2: string
  // ... outros campos obrigatorios
}

// Props da entidade (inclui campos herdados)
interface {Entity}Props extends DefaultEntityProps {
  field1: string
  field2: string
  // ... outros campos
}

export class {Entity}Entity extends Entity {
  private readonly _field1: string
  private readonly _field2: string

  private constructor({
    field1,
    field2,
    id,
    is_deleted,
    is_blocked,
    deleted_at,
    is_active,
    created_at,
    updated_at
  }: {Entity}Props) {
    super(
      id,
      created_at,
      updated_at,
      is_active,
      is_deleted,
      is_blocked,
      deleted_at
    )
    this._field1 = field1
    this._field2 = field2
  }

  // Factory method para reconstituir do banco
  static reconstitute(props: {Entity}Props): {Entity}Entity {
    return new {Entity}Entity(props)
  }

  // Factory method para criar novo
  static create(command: Create{Entity}Command): {Entity}Entity {
    return new {Entity}Entity(command)
  }

  // Getters
  get field1(): string {
    return this._field1
  }

  get field2(): string {
    return this._field2
  }

  // Implementacoes obrigatorias
  get entity_id(): ValueObject {
    return this.id
  }

  toJSON() {
    return {
      id: this.id.id,
      field1: this._field1,
      field2: this._field2
    }
  }
}
```

**Atualizar o index:**

```typescript
// src/modules/lead/domain/entities/index.ts
export * from './{entity}.entity'
```

---

## Passo 2: Criar o Model (Schema Drizzle)

**Arquivo:** `src/modules/lead/domain/models/{entity}.model.ts`

```typescript
import { Model } from '@modules/shared/domain/entities/models'
import { pgTable, text } from 'drizzle-orm/pg-core'

export const {Entity}Schema = pgTable('{entities}', {
  ...Model,  // id, created_at, updated_at, is_deleted, is_active, is_blocked
  field1: text('field1').notNull(),
  field2: text('field2').notNull()
  // Outros campos conforme necessidade
})

export type {Entity}Model = typeof {Entity}Schema.$inferSelect
export type New{Entity}Model = typeof {Entity}Schema.$inferInsert
```

**Atualizar o index:**

```typescript
// src/modules/lead/domain/models/index.ts
export * from './{entity}.model'
```

---

## Passo 3: Criar a Migration

**Arquivo:** `drizzle/XXXX_{entities}.sql`

```sql
CREATE TABLE "{entities}" (
  "id" uuid PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  "is_deleted" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_blocked" boolean DEFAULT false NOT NULL,
  "field1" text NOT NULL,
  "field2" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "{entities}_field1_idx" ON "{entities}" ("field1");
```

**Nota:** O numero `XXXX` deve ser sequencial (verifique o ultimo arquivo em `drizzle/`).

---

## Passo 4: Atualizar o Contrato do Repositorio

**Arquivo:** `src/modules/lead/domain/repositories/lead.repository.ts`

```typescript
// Adicionar import
import { {Entity}Model } from '../models/{entity}.model'

// Adicionar metodos na interface ILeadRepository
export interface ILeadRepository extends IRepository<LeadModel, NewLeadModel> {
  // ... metodos existentes ...

  // {entity} module
  find{Entity}ByField1(field1: string): Promise<{Entity}Model | null>
  findAll{Entities}(): Promise<{Entity}Model[]>
  create{Entity}(entity: {Entity}Model): Promise<{Entity}Model>
  bulk{Entity}Insert(entities: {Entity}Model[]): Promise<number>
}
```

---

## Passo 5: Implementar os Metodos no Repositorio

**Arquivo:** `src/modules/lead/infra/repositories/lead.repository.ts`

```typescript
// Adicionar imports
import {
  {Entity}Model,
  {Entity}Schema
} from '@modules/lead/domain/models/{entity}.model'

// Adicionar propriedade na classe
private readonly {entity}Table = {Entity}Schema

// Implementar metodos
async find{Entity}ByField1(field1: string): Promise<{Entity}Model | null> {
  const result = await this.db
    .select()
    .from(this.{entity}Table)
    .where(eq(this.{entity}Table.field1, field1))
    .limit(1)

  return result[0] || null
}

async findAll{Entities}(): Promise<{Entity}Model[]> {
  const result = await this.db
    .select()
    .from(this.{entity}Table)
    .where(eq(this.{entity}Table.isDeleted, false))

  return result
}

async create{Entity}(entity: {Entity}Model): Promise<{Entity}Model> {
  const result = await this.db
    .insert(this.{entity}Table)
    .values(entity)
    .returning()

  return result[0]
}

async bulk{Entity}Insert(entities: {Entity}Model[]): Promise<number> {
  await this.db.insert(this.{entity}Table).values(entities)
  return entities.length
}
```

---

## Passo 6: Criar o Mapper

**Arquivo:** `src/modules/lead/application/mappers/{entity}.mapper.ts`

```typescript
import { {Entity}Entity } from '@modules/lead/domain/entities/{entity}.entity'
import {
  {Entity}Model,
  New{Entity}Model
} from '@modules/lead/domain/models/{entity}.model'
import { UuidVO } from '@modules/core/domain/valueObject'

export interface {Entity}Output {
  id: string
  field1: string
  field2: string
}

export class {Entity}Mapper {
  static toEntity(model: {Entity}Model): {Entity}Entity {
    return {Entity}Entity.reconstitute({
      id: new UuidVO(model.id),
      field1: model.field1,
      field2: model.field2,
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  static toModel(entity: {Entity}Entity): New{Entity}Model {
    return {
      id: entity.id.id,
      field1: entity.field1,
      field2: entity.field2
    }
  }

  static toOutput(model: {Entity}Model): {Entity}Output {
    return {
      id: model.id,
      field1: model.field1,
      field2: model.field2
    }
  }

  static entityToOutput(entity: {Entity}Entity): {Entity}Output {
    return {
      id: entity.id.id,
      field1: entity.field1,
      field2: entity.field2
    }
  }
}
```

---

## Passo 7: Criar os Use Cases

### 7.1 Estrutura de diretorios

```bash
mkdir -p src/modules/lead/application/use-cases/{entity}/find-by-field1/dtos
```

### 7.2 DTO de Output

**Arquivo:** `src/modules/lead/application/use-cases/{entity}/find-by-field1/dtos/find-{entity}-by-field1.output.ts`

```typescript
import { {Entity}Output } from '@modules/lead/application/mappers/{entity}.mapper'

export type Find{Entity}ByField1Output = {Entity}Output | null
```

**Index:** `src/modules/lead/application/use-cases/{entity}/find-by-field1/dtos/index.ts`

```typescript
export * from './find-{entity}-by-field1.output'
```

### 7.3 Use Case

**Arquivo:** `src/modules/lead/application/use-cases/{entity}/find-by-field1/find-{entity}-by-field1.use-case.ts`

```typescript
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { {Entity}Mapper } from '@modules/lead/application/mappers/{entity}.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { Find{Entity}ByField1Output } from './dtos'

@Injectable()
export class Find{Entity}ByField1UseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(field1: string): Promise<ModelOutput<Find{Entity}ByField1Output>> {
    try {
      if (!field1) {
        return new ModelOutput<Find{Entity}ByField1Output>({
          data: null,
          hasError: true,
          error: { field1: ['Field1 is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.find{Entity}ByField1(field1)

      if (!model) {
        return new ModelOutput<Find{Entity}ByField1Output>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<Find{Entity}ByField1Output>({
        data: {Entity}Mapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<Find{Entity}ByField1Output>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
```

### 7.4 Index files

**Arquivo:** `src/modules/lead/application/use-cases/{entity}/find-by-field1/index.ts`

```typescript
export * from './find-{entity}-by-field1.use-case'
export * from './dtos'
```

**Arquivo:** `src/modules/lead/application/use-cases/{entity}/index.ts`

```typescript
export * from './find-by-field1'
```

---

## Passo 8: Criar o Import Processor (Bull Queue)

**Arquivo:** `src/modules/lead/infra/queues/{entity}-import.processor.ts`

```typescript
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

export const {ENTITY}_IMPORT_QUEUE = '{entity}-import'

export interface {Entity}ImportJobData {
  filePath: string
  batchSize: number
  delimiter: string
  skipHeader: boolean
}

export interface {Entity}ImportJobResult {
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors: Array<{ line: number; error: string }>
  durationMs: number
}

@Processor({ENTITY}_IMPORT_QUEUE)
export class {Entity}ImportProcessor {
  private readonly logger = new Logger({Entity}ImportProcessor.name)

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Process()
  async handleImport(
    job: Job<{Entity}ImportJobData>
  ): Promise<{Entity}ImportJobResult> {
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
    job: Job<{Entity}ImportJobData>
  ): Promise<Omit<{Entity}ImportJobResult, 'durationMs'>> {
    const client = await this.pool.connect()

    try {
      this.logger.log('Starting COPY directly to {entities} table...')
      const copyQuery = copyFrom(
        `COPY {entities} (id, field1, field2, created_at, updated_at, is_deleted, is_active, is_blocked) FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '')`
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
    job: Job<{Entity}ImportJobData>
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

    if (parts.length < 2) {
      return null
    }

    // Adaptar conforme formato do CSV
    // Exemplo: "field1";"field2"
    const [field1, field2] = parts

    if (!field1 || !field2) {
      return null
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    return [id, field1, field2, now, now, 'false', 'true', 'false'].join(',')
  }

  @OnQueueCompleted()
  onCompleted(job: Job<{Entity}ImportJobData>, result: {Entity}ImportJobResult) {
    this.logger.log(
      `Job ${job.id} completed successfully: ${result.totalImported} records imported`
    )
  }

  @OnQueueFailed()
  onFailed(job: Job<{Entity}ImportJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack)
  }
}
```

**Atualizar o index:**

```typescript
// src/modules/lead/infra/queues/index.ts
export * from './{entity}-import.processor'
```

---

## Passo 9: Criar o Controller

### 9.1 DTO de Import

**Arquivo:** `src/modules/lead/application/controllers/dtos/import-{entity}.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max
} from 'class-validator'
import { Type } from 'class-transformer'

export class Import{Entity}OptionsDto {
  @ApiPropertyOptional({
    description: 'Batch size for bulk inserts',
    example: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @Type(() => Number)
  batchSize?: number

  @ApiPropertyOptional({ description: 'CSV delimiter character', example: ';' })
  @IsOptional()
  @IsString()
  delimiter?: string

  @ApiPropertyOptional({ description: 'Skip header row', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  skipHeader?: boolean
}
```

**Atualizar o index:**

```typescript
// src/modules/lead/application/controllers/dtos/index.ts
export * from './import-{entity}.dto'
```

### 9.2 Controller

**Arquivo:** `src/modules/lead/application/controllers/{entity}.controller.ts`

```typescript
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
import { Find{Entity}ByField1UseCase } from '../use-cases/{entity}'
import { Import{Entity}OptionsDto } from './dtos'
import {
  {ENTITY}_IMPORT_QUEUE,
  {Entity}ImportJobData
} from '@modules/lead/infra/queues'

const csvStorage = diskStorage({
  destination: tmpdir(),
  filename: (_req, file, cb) => {
    const uniqueName = `{entity}-import-${randomUUID()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

@ApiTags('{Entities} ({Descricao})')
@Controller('{entity}')
export class {Entity}Controller {
  constructor(
    @InjectQueue({ENTITY}_IMPORT_QUEUE)
    private readonly importQueue: Queue<{Entity}ImportJobData>
  ) {}

  @Inject(Find{Entity}ByField1UseCase)
  private readonly findByField1UseCase: Find{Entity}ByField1UseCase

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: csvStorage }))
  @ApiOperation({
    summary: 'Import {Entity} data from CSV file (async)',
    description:
      'Queues an import job for {Entity} data from a CSV file. Returns a job ID to track progress.'
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
          example: '/api/{entity}/import/status/123'
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
    @Body() options: Import{Entity}OptionsDto,
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
      statusUrl: `/api/{entity}/import/status/${job.id}`
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

  @Get('field1/:field1')
  @ApiOperation({
    summary: 'Find {Entity} by field1',
    description: 'Returns a {entity} by its field1'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '{Entity} data retrieved successfully'
  })
  async findByField1(@Param('field1') field1: string, @Res() res: Response) {
    const result = await this.findByField1UseCase.execute(field1)
    return res.status(result.statusCode).json(result)
  }
}
```

**Atualizar o index:**

```typescript
// src/modules/lead/application/controllers/index.ts
export * from './{entity}.controller'
```

---

## Passo 10: Criar o Provider

**Arquivo:** `src/modules/lead/infra/providers/{entity}.provider.ts`

```typescript
import { Find{Entity}ByField1UseCase } from '@modules/lead/application/use-cases/{entity}'

const USE_CASES_PROVIDERS = {
  Find{Entity}ByField1UseCase: {
    provide: Find{Entity}ByField1UseCase,
    useClass: Find{Entity}ByField1UseCase
  }
} as const

export const {ENTITY}_PROVIDERS = {
  USE_CASES_PROVIDERS
}
```

**Atualizar o index:**

```typescript
// src/modules/lead/infra/providers/index.ts
export * from './{entity}.provider'
```

---

## Passo 11: Integrar no Modulo

**Arquivo:** `src/modules/lead/lead.module.ts`

```typescript
// Adicionar imports
import {
  {Entity}Controller
} from './application/controllers'
import {
  {ENTITY}_PROVIDERS
} from './infra/providers'
import {
  {Entity}ImportProcessor,
  {ENTITY}_IMPORT_QUEUE
} from './infra/queues'

@Module({
  imports: [
    // ... imports existentes ...
    BullModule.registerQueue(
      // ... queues existentes ...
      { name: {ENTITY}_IMPORT_QUEUE }
    )
  ],
  controllers: [
    // ... controllers existentes ...
    {Entity}Controller
  ],
  providers: [
    // ... providers existentes ...
    {Entity}ImportProcessor,
    ...Object.values({ENTITY}_PROVIDERS.USE_CASES_PROVIDERS)
  ]
})
export class LeadModule {}
```

---

## Passo 12: Criar Testes Unitarios

**Arquivo:** `tests/modules/lead/infra/queues/{entity}-import.processor.spec.ts`

```typescript
import { {Entity}ImportProcessor } from '@modules/lead/infra/queues/{entity}-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('{Entity}ImportProcessor', () => {
  let processor: {Entity}ImportProcessor
  let mockPool: jest.Mocked<Pool>
  let mockClient: {
    query: jest.Mock
    release: jest.Mock
  }
  let tempDir: string
  let testFilePath: string

  const createMockJob = (
    overrides: Partial<Job['data']> = {}
  ): jest.Mocked<Job<any>> => {
    return {
      id: '1',
      data: {
        filePath: testFilePath,
        batchSize: 1000,
        delimiter: ';',
        skipHeader: false,
        ...overrides
      },
      progress: jest.fn().mockResolvedValue(undefined)
    } as any
  }

  const createCsvContent = (lines: string[], includeHeader = false): string => {
    const header = 'FIELD1;FIELD2'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `{entity}-import-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })
  })

  beforeEach(async () => {
    testFilePath = join(tempDir, `test-${randomUUID()}.csv`)

    mockClient = {
      query: jest.fn().mockImplementation((query: any) => {
        if (typeof query === 'object' && query.submit) {
          const stream = {
            rowCount: 0,
            on: jest.fn((event: string, cb: () => void) => {
              if (event === 'finish') setTimeout(cb, 0)
              return stream
            }),
            emit: jest.fn(),
            write: jest.fn().mockReturnValue(true),
            end: jest.fn()
          }
          return stream
        }
        return { rowCount: 0 } as QueryResult
      }),
      release: jest.fn()
    } as any

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    } as any

    processor = new {Entity}ImportProcessor(mockPool)
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist
    }
  })

  describe('transformLine', () => {
    it('should correctly parse CSV line', () => {
      const line = '"value1";"value2"'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      expect(parts[1]).toBe('value1')
      expect(parts[2]).toBe('value2')
    })

    it('should return null for lines with less than 2 columns', () => {
      const line = 'value1'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should return null for lines without required fields', () => {
      const line = ';value2'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent(['"value1";"value2"'])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      jest.spyOn(processor as any, 'importWithCopy').mockResolvedValue({
        totalProcessed: 1,
        totalImported: 1,
        totalErrors: 0,
        errors: []
      })

      await processor.handleImport(job)

      await expect(
        import('node:fs/promises').then(fs => fs.access(testFilePath))
      ).rejects.toThrow()
    })

    it('should return correct result structure on success', async () => {
      const csvContent = createCsvContent(['"value1";"value2"'])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      jest.spyOn(processor as any, 'importWithCopy').mockResolvedValue({
        totalProcessed: 100,
        totalImported: 100,
        totalErrors: 0,
        errors: []
      })

      const result = await processor.handleImport(job)

      expect(result).toEqual({
        totalProcessed: 100,
        totalImported: 100,
        totalErrors: 0,
        errors: [],
        durationMs: expect.any(Number)
      })
    })
  })

  describe('onFailed', () => {
    it('should log error message', () => {
      const loggerSpy = jest.spyOn((processor as any).logger, 'error')
      const job = createMockJob()
      const error = new Error('Test error')

      processor.onFailed(job, error)

      expect(loggerSpy).toHaveBeenCalledWith(
        'Job 1 failed: Test error',
        error.stack
      )
    })
  })

  describe('onCompleted', () => {
    it('should log success message', () => {
      const loggerSpy = jest.spyOn((processor as any).logger, 'log')
      const job = createMockJob()
      const result = {
        totalProcessed: 100,
        totalImported: 100,
        totalErrors: 0,
        errors: [],
        durationMs: 1000
      }

      processor.onCompleted(job, result)

      expect(loggerSpy).toHaveBeenCalledWith(
        'Job 1 completed successfully: 100 records imported'
      )
    })
  })
})
```

---

## Passo 13: Criar Testes de Integracao

**Arquivo:** `tests/modules/lead/infra/queues/{entity}-import.processor.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { {Entity}ImportProcessor } from '@modules/lead/infra/queues/{entity}-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('{Entity}ImportProcessor (Integration)', () => {
  let processor: {Entity}ImportProcessor
  let module: TestingModule
  let pool: Pool
  let tempDir: string
  let testFilePath: string

  const createMockJob = (
    overrides: Partial<Job['data']> = {}
  ): jest.Mocked<Job<any>> => {
    return {
      id: '1',
      data: {
        filePath: testFilePath,
        batchSize: 1000,
        delimiter: ';',
        skipHeader: false,
        ...overrides
      },
      progress: jest.fn().mockResolvedValue(undefined)
    } as any
  }

  const createCsvContent = (lines: string[]): string => {
    return lines.join('\n')
  }

  const cleanupTestData = async (field1Values: string[]) => {
    const client = await pool.connect()
    try {
      for (const value of field1Values) {
        await client.query('DELETE FROM {entities} WHERE field1 = $1', [value])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `{entity}-import-integration-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [{Entity}ImportProcessor]
    }).compile()

    processor = module.get<{Entity}ImportProcessor>({Entity}ImportProcessor)
    pool = module.get<Pool>(PG_POOL)
  })

  beforeEach(async () => {
    testFilePath = join(tempDir, `test-${randomUUID()}.csv`)
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist or already deleted
    }
  })

  afterAll(async () => {
    await module.close()
  })

  describe('handleImport with real database', () => {
    it('should import data from CSV file to database', async () => {
      const uniqueValue1 = `T${Date.now().toString().slice(-5)}1`
      const uniqueValue2 = `T${Date.now().toString().slice(-5)}2`

      const csvContent = createCsvContent([
        `"${uniqueValue1}";"VALUE ONE"`,
        `"${uniqueValue2}";"VALUE TWO"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(2)
        expect(result.totalErrors).toBe(0)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM {entities} WHERE field1 IN ($1, $2)',
            [uniqueValue1, uniqueValue2]
          )
          expect(queryResult.rows.length).toBe(2)
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestData([uniqueValue1, uniqueValue2])
      }
    })
  })
})
```

---

## Passo 14: Atualizar Mocks de Teste

### 14.1 LeadInMemoryRepository

**Arquivo:** `tests/modules/lead/infra/repositories/lead-in-memory.repository.ts`

Adicionar:

```typescript
// Import
import { {Entity}Model } from '@modules/lead/domain/models/{entity}.model'

// Propriedade
private readonly {entity}Items: {Entity}Model[] = []

// Metodos
async find{Entity}ByField1(field1: string): Promise<{Entity}Model | null> {
  return this.{entity}Items.find(item => item.field1 === field1) ?? null
}

async findAll{Entities}(): Promise<{Entity}Model[]> {
  return this.{entity}Items.filter(item => !item.isDeleted)
}

async create{Entity}(entity: {Entity}Model): Promise<{Entity}Model> {
  this.{entity}Items.push(entity)
  return entity
}

async bulk{Entity}Insert(entities: {Entity}Model[]): Promise<number> {
  this.{entity}Items.push(...entities)
  return entities.length
}

// Metodos auxiliares
clear{Entities}(): void {
  this.{entity}Items.length = 0
}

get{Entity}Items(): {Entity}Model[] {
  return [...this.{entity}Items]
}
```

### 14.2 Mocks em outros testes

Atualizar qualquer mock de `ILeadRepository` para incluir os novos metodos:

```typescript
const createMockLeadRepository = (): jest.Mocked<ILeadRepository> => ({
  // ... metodos existentes ...
  find{Entity}ByField1: jest.fn(),
  findAll{Entities}: jest.fn(),
  create{Entity}: jest.fn(),
  bulk{Entity}Insert: jest.fn()
})
```

---

## Checklist Final

- [ ] **Domain Layer**
  - [ ] Entidade criada em `domain/entities/`
  - [ ] Entidade exportada no `index.ts`
  - [ ] Model criado em `domain/models/`
  - [ ] Model exportado no `index.ts`
  - [ ] Contrato do repositorio atualizado

- [ ] **Infrastructure Layer**
  - [ ] Metodos implementados no repositorio
  - [ ] Processor criado em `infra/queues/`
  - [ ] Processor exportado no `index.ts`
  - [ ] Provider criado em `infra/providers/`
  - [ ] Provider exportado no `index.ts`

- [ ] **Application Layer**
  - [ ] Mapper criado em `application/mappers/`
  - [ ] Use case criado em `application/use-cases/`
  - [ ] Use case exportado nos `index.ts`
  - [ ] DTO de import criado em `controllers/dtos/`
  - [ ] DTO exportado no `index.ts`
  - [ ] Controller criado em `application/controllers/`
  - [ ] Controller exportado no `index.ts`

- [ ] **Database**
  - [ ] Migration criada em `drizzle/`

- [ ] **Module Integration**
  - [ ] Controller registrado no modulo
  - [ ] Processor registrado no modulo
  - [ ] Queue registrada no BullModule
  - [ ] Providers registrados no modulo

- [ ] **Tests**
  - [ ] Testes unitarios criados
  - [ ] Testes de integracao criados
  - [ ] LeadInMemoryRepository atualizado
  - [ ] Mocks em outros testes atualizados
  - [ ] Todos os testes passando (`npm test`)

- [ ] **Build**
  - [ ] Build passando (`npm run build`)
  - [ ] Linting passando (`npm run lint:check`)

---

## Comandos Uteis

```bash
# Rodar testes
docker compose exec -T app npm test

# Rodar build
docker compose exec -T app npm run build

# Rodar linting
docker compose exec -T app npm run lint:check

# Gerar migration (se necessario)
npx drizzle-kit generate

# Rodar migration
DATABASE_URL="postgresql://user:pass@host:port/db" npx drizzle-kit migrate

# Verificar status do git
git status

# Criar branch
git checkout -b feat/{entity}-import-flow

# Fazer commit
git add . && git commit -m "feat(lead): add {entity} entity and model"

# Fazer push
git push -u origin feat/{entity}-import-flow
```

---

## Exemplo de Commits Semanticos

1. `feat(lead): add {entity} entity and model`
2. `feat(lead): add {entity} database migration`
3. `feat(lead): add {entity} repository contract and implementation`
4. `feat(lead): add {entity} mapper and find-by-field use case`
5. `feat(lead): add {entity} import processor with Bull queue`
6. `feat(lead): add {entity} controller, DTOs and provider`
7. `feat(lead): integrate {entity} module in lead module`
8. `test(lead): add {entity} import processor unit and integration tests`

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Bull Queue Documentation](https://docs.bullmq.io/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
