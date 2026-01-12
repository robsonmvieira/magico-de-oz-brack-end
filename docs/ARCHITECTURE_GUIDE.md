# Architecture Guide - Mágico de Oz CRM

Este documento fornece um guia arquitetural profundo para agentes de IA e desenvolvedores que trabalham neste repositório. O objetivo é dar contexto completo sobre decisões de design, padrões implementados e fluxos de dados.

---

## Visão Geral

O Mágico de Oz é um CRM construído com **NestJS** seguindo princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. A arquitetura é organizada em camadas com separação clara de responsabilidades.

### Stack Tecnológica

| Camada     | Tecnologia    | Propósito                                   |
| ---------- | ------------- | ------------------------------------------- |
| Framework  | NestJS 11     | Injeção de dependência, módulos, decorators |
| ORM        | Drizzle ORM   | Type-safe queries, migrations, schemas      |
| Banco      | PostgreSQL 16 | Persistência principal                      |
| Cache      | Redis         | Cache e sessões                             |
| Mensageria | RabbitMQ      | Eventos de domínio e integração             |
| Testes     | Jest + SWC    | Testes unitários e integração               |

---

## Estrutura de Módulos

```
src/modules/
├── core/                    # Abstrações base do DDD
│   ├── domain/
│   │   ├── entities/        # Entity, AggregateRoot, Notification
│   │   ├── repositories/    # IRepository, IUnitOfWork
│   │   └── valueObject/     # ValueObject base, UuidVO
│   └── application/
│       └── use-cases/common/  # ModelOutput, ModelCollectionOutput
│
├── shared/                  # Infraestrutura compartilhada
│   ├── domain/entities/models/  # Base Model (campos de auditoria)
│   └── infra/repositories/      # DrizzleRepository base
│
├── database/                # Configuração Drizzle + Pool
├── env/                     # Variáveis de ambiente
│
└── {domain-module}/         # Módulos de domínio (ex: lead)
    ├── domain/
    │   ├── entities/
    │   ├── valueObject/
    │   ├── models/          # Schemas Drizzle
    │   ├── repositories/    # Interfaces
    │   └── enums/
    ├── application/
    │   ├── controllers/
    │   ├── dtos/
    │   ├── mappers/
    │   └── use-cases/
    ├── infra/
    │   ├── repositories/    # Implementações Drizzle + InMemory
    │   └── providers/       # Configuração de DI
    └── tests/               # Fake Builders
```

---

## Camada de Domínio

### 1. Value Objects

Value Objects encapsulam valores imutáveis com regras de validação. Todos estendem a classe base `ValueObject`.

#### Classe Base

```typescript
// src/modules/core/domain/valueObject/value-object.vo.ts
export abstract class ValueObject {
  // Usa lodash isEqual para comparação profunda
  equals(vo: ValueObject): boolean

  // Subclasses implementam o valor
  abstract get value(): any
}
```

#### Tipos de Value Objects

**Simples** - Encapsulam um único valor com validação:

```typescript
// EmailVO: valida formato, converte para lowercase
const email = EmailVO.create('User@Example.com')
email.value // 'user@example.com'

// PhoneVO: valida telefone brasileiro, formata
const phone = PhoneVO.create('11987654321')
phone.value // '11987654321'
phone.formatted // '(11) 98765-4321'

// NameVO: valida tamanho (2-100 caracteres)
const name = NameVO.create('Empresa XYZ')
```

**UUID** - Identificadores únicos:

```typescript
// UuidVO: gera ou valida UUID v4
const id = UuidVO.create() // gera novo
const id = UuidVO.create('existing-uuid') // valida existente

// Especializados por entidade
const leadId = new LeadId('uuid')
const categoryId = new LeadCategoryId('uuid')
```

**Coleção** - Gerenciam listas imutáveis:

```typescript
// KeywordsVO: coleção de KeywordVO
const keywords = KeywordsVO.create(['marketing', 'digital'])
keywords.add('vendas') // retorna nova instância
keywords.remove('marketing') // retorna nova instância
keywords.matchesAny('texto com marketing') // true
keywords.countMatches('marketing digital vendas') // 3
```

**Compostos** - Agregam múltiplos campos:

```typescript
// AddressVO: endereço completo
const address = AddressVO.create({
  street: 'Rua A',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  neighborhood: 'Centro',
  latitude: -23.55,
  longitude: -46.63
})

// LeadScoreVO: pontuação com pesos
const score = LeadScoreVO.create({
  completeness: 75, // peso 30%
  icpFit: 80, // peso 50%
  engagement: 60 // peso 20%
})
score.total() // cálculo ponderado

// EnrichmentStatusVO: status de enriquecimento
const status = EnrichmentStatusVO.create({
  googleMaps: { enriched: true, at: new Date() },
  cnpjWs: { enriched: false },
  apollo: { enriched: false },
  hunter: { enriched: false },
  linkedin: { enriched: false }
})
status.markEnriched('apollo') // retorna nova instância
status.completionPercentage() // 20
```

### 2. Entidades

Entidades têm identidade única e ciclo de vida. Todas estendem `AggregateRoot`.

#### Hierarquia de Classes

```
ValueObject (core)
    └── UuidVO
          └── LeadId, LeadCategoryId

Entity (core)
    ├── id: UuidVO
    ├── created_at, updated_at, deleted_at: Date
    ├── is_active, is_deleted, is_blocked: boolean
    ├── notification: Notification
    └── métodos protegidos: touch(), addErrorOnContainer()
        │
        └── AggregateRoot
              ├── domain events (EventEmitter2)
              └── getUncommittedEvents(), clearEvents()
                    │
                    ├── LeadCategoryEntity
                    └── LeadEntity
```

#### Padrão de Entidade

```typescript
export class LeadCategoryEntity extends AggregateRoot {
  // Campos privados com prefixo _
  _name: NameVO
  _slug: SlugVO
  _keywords: KeywordsVO

  // Construtor privado - usa factory methods
  private constructor(props: LeadCategoryProps) {
    super(props.id, props.created_at, ...)
    this._name = NameVO.create(props.name.value)
    // ...
  }

  // Factory: criação de novo
  static create(cmd: CreateCategoryCommand): LeadCategoryEntity {
    const entity = new LeadCategoryEntity({
      name: NameVO.create(cmd.name),
      slug: SlugVO.fromName(cmd.name),
      // ... defaults para novos
    })
    // validações e domain events aqui
    return entity
  }

  // Factory: reconstituição do banco
  static reconstitute(props: LeadCategoryProps): LeadCategoryEntity {
    return new LeadCategoryEntity(props)
  }

  // Factory: dados de teste
  static fake() {
    return LeadCategoryFakeBuilder
  }

  // Métodos de domínio - lógica de negócio
  rename(newName: string): void {
    this._name = NameVO.create(newName)
    this._slug = SlugVO.fromName(newName)
    this.touch() // atualiza updated_at
  }

  matchesText(text: string): boolean {
    return this._keywords.matchesAny(text)
  }

  // Serialização
  toJSON() {
    return {
      id: this.id.id,
      name: this._name.value,
      // ...
    }
  }
}
```

#### Notification Pattern

Entidades coletam erros de validação em vez de lançar exceções:

```typescript
// Na entidade
this.addErrorOnContainer('name', 'Name must have at least 2 characters')

// No use case
if (entity.notification.hasError()) {
  return new ModelOutput({
    data: null,
    hasError: true,
    error: entity.notification.errors,
    statusCode: HttpStatus.BAD_REQUEST
  })
}
```

### 3. Enums de Domínio

```typescript
// LeadSource: origem do lead
enum LeadSource {
  GOOGLE_MAPS = 'google_maps',
  APOLLO = 'apollo',
  HUNTER = 'hunter',
  LINKEDIN = 'linkedin',
  IMPORTED = 'imported',
  MANUAL = 'manual',
  REFERRAL = 'referral'
}

// LeadStage: estágio no funil
enum LeadStage {
  NEW = 'new',
  CONTACTED = 'contacted',
  REPLIED = 'replied',
  INTERESTED = 'interested',
  MEETING_SCHEDULED = 'meeting_scheduled',
  CONVERTED = 'converted',
  LOST = 'lost',
  NURTURING = 'nurturing',
  DISCARDED = 'discarded',
  READY = 'ready'
}

// LeadTemperature: temperatura calculada
enum LeadTemperature {
  HOT = 'hot', // score >= 70 ou stage = REPLIED
  WARM = 'warm', // score 40-70
  COLD = 'cold', // score < 40
  DISCARDED = 'discarded'
}
```

---

## Camada de Persistência

### 1. Models (Schemas Drizzle)

Models definem a estrutura do banco usando Drizzle ORM.

#### Base Model

```typescript
// src/modules/shared/domain/entities/models/base.modal.ts
export const Model = {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull()
}
```

#### Schema de Domínio

```typescript
// src/modules/lead/domain/models/lead.model.ts

// Enums PostgreSQL
export const leadSourceEnum = pgEnum('lead_source', [
  'google_maps',
  'apollo',
  'hunter',
  'linkedin',
  'imported',
  'manual',
  'referral'
])

// Schema da tabela
export const LeadSchema = pgTable('leads', {
  ...Model,
  leadCategoryId: uuid('lead_category_id')
    .references(() => LeadCategorySchema.id)
    .notNull(),
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),

  // Campos JSONB para VOs complexos
  address: jsonb('address').$type<AddressJson>(),
  sizeClassification: jsonb('size_classification').$type<ClassificationJson>(),
  googleMapsData: jsonb('google_maps_data').$type<GoogleMapsDataJson>(),
  cnpjWsData: jsonb('cnpj_ws_data').$type<CnpjDataJson>(),
  decisionMakers: jsonb('decision_makers')
    .$type<DecisionMakerJson[]>()
    .default([])
    .notNull(),
  enrichmentStatus: jsonb('enrichment_status')
    .$type<EnrichmentStatusJson>()
    .notNull(),
  score: jsonb('score').$type<LeadScoreJson>().notNull(),

  // Enums
  temperature: leadTemperatureEnum('temperature').default('cold').notNull(),
  stage: leadStageEnum('stage').default('new').notNull(),
  source: leadSourceEnum('source').notNull()
})

// Tipos inferidos
export type LeadModel = typeof LeadSchema.$inferSelect
export type NewLeadModel = typeof LeadSchema.$inferInsert
```

### 2. Interfaces de Repositório

Definidas no domínio, implementadas na infraestrutura.

```typescript
// src/modules/lead/domain/repositories/lead.repository.ts
export interface ILeadRepository extends IRepository<LeadModel, NewLeadModel> {
  // Busca por campos únicos
  findByCompanyName(companyName: string): Promise<LeadModel | null>
  findByEmail(email: string): Promise<LeadModel | null>
  findByPhone(phone: string): Promise<LeadModel | null>

  // Busca por relacionamentos
  findByCategoryId(categoryId: string): Promise<LeadModel[]>

  // Busca por status
  findByStage(stage: LeadStage): Promise<LeadModel[]>
  findByTemperature(temperature: LeadTemperature): Promise<LeadModel[]>

  // Verificações de existência
  exists(id: string): Promise<boolean>
  existsByCompanyName(companyName: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>
}
```

### 3. Implementação Drizzle

```typescript
// src/modules/lead/infra/repositories/lead-category.repository.ts
@Injectable()
export class LeadCategoryRepository
  extends DrizzleRepository<LeadCategoryModel, NewLeadCategoryModel>
  implements ILeadCategoryRepository
{
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, LeadCategorySchema)
  }

  async findBySlug(slug: string): Promise<LeadCategoryModel | null> {
    const [result] = await this.db
      .select()
      .from(LeadCategorySchema)
      .where(eq(LeadCategorySchema.slug, slug))
      .limit(1)
    return result ?? null
  }

  async findByKeywordMatch(text: string): Promise<LeadCategoryModel[]> {
    return this.db
      .select()
      .from(LeadCategorySchema)
      .where(ilike(LeadCategorySchema.keywords, `%${text}%`))
  }

  async existsByName(name: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: LeadCategorySchema.id })
      .from(LeadCategorySchema)
      .where(eq(LeadCategorySchema.name, name))
      .limit(1)
    return !!result
  }
}
```

#### DrizzleRepository Base

```typescript
// src/modules/shared/infra/repositories/drizzle-base.repository.ts
export abstract class DrizzleRepository<
  TSelect,
  TInsert
> implements IRepository<TSelect, TInsert> {
  constructor(
    protected readonly db: DrizzleDB,
    protected readonly schema: any
  ) {}

  async save(entity: TInsert): Promise<void> {
    await this.db.insert(this.schema).values(entity)
  }

  async update(modelId: string, entity: Partial<TInsert>): Promise<void> {
    await this.db
      .update(this.schema)
      .set(entity)
      .where(eq(this.schema.id, modelId))
  }

  // Soft delete
  async delete(entity: TSelect): Promise<void> {
    await this.db
      .update(this.schema)
      .set({ isDeleted: true })
      .where(eq(this.schema.id, (entity as any).id))
  }

  async findById(id: string): Promise<TSelect | null> {
    const [result] = await this.db
      .select()
      .from(this.schema)
      .where(eq(this.schema.id, id))
      .limit(1)
    return result ?? null
  }

  async findAll(): Promise<TSelect[]> {
    return this.db
      .select()
      .from(this.schema)
      .where(eq(this.schema.isDeleted, false))
  }
}
```

### 4. Repositório In-Memory (Testes)

```typescript
// tests/modules/lead/infra/repositories/lead-category-in-memory.repository.ts
export class LeadCategoryInMemoryRepository implements ILeadCategoryRepository {
  private items: LeadCategoryModel[] = []

  async save(entity: NewLeadCategoryModel): Promise<void> {
    this.items.push({
      ...entity,
      createdAt: new Date(),
      updatedAt: new Date()
    } as LeadCategoryModel)
  }

  async delete(entity: LeadCategoryModel): Promise<void> {
    const index = this.items.findIndex(item => item.id === entity.id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], isDeleted: true }
    }
  }

  async findById(id: string): Promise<LeadCategoryModel | null> {
    return this.items.find(item => item.id === id && !item.isDeleted) ?? null
  }

  // Métodos de teste
  clear(): void {
    this.items = []
  }

  getItems(): LeadCategoryModel[] {
    return [...this.items]
  }
}
```

---

## Camada de Aplicação

### 1. DTOs e Validação

DTOs usam class-validator para validação de entrada.

```typescript
// src/modules/lead/application/dtos/create-lead-category.dto.ts
export class CreateLeadCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Marketing' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name must have at least 2 characters' })
  @MaxLength(100)
  name: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiProperty({ required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[]

  constructor(props?: CreateLeadCategoryDtoProps) {
    if (!props) return
    Object.assign(this, props)
  }
}

// Validador estático
export class CreateLeadCategoryDtoValidator {
  static validate(props: CreateLeadCategoryDtoProps): Record<string, string[]> {
    const dto = new CreateLeadCategoryDto(props)
    const errors = validateSync(dto)

    const formattedErrors: Record<string, string[]> = {}
    errors.forEach(error => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints)
      }
    })
    return formattedErrors
  }
}
```

#### IdParamDto

DTO centralizado para validação de UUID em parâmetros:

```typescript
// src/modules/lead/application/dtos/id-param.dto.ts
export class IdParamDto {
  @IsNotEmpty({ message: 'ID is required' })
  @IsUUID('4', { message: 'Invalid UUID format' })
  id: string
}

export class IdParamDtoValidator {
  static validate(props: { id: string }): Record<string, string[]> {
    const dto = new IdParamDto(props)
    const errors = validateSync(dto)
    // ... converte para Record<string, string[]>
  }
}
```

### 2. Use Cases

Use Cases encapsulam a lógica de negócio e orquestram o fluxo.

#### Estrutura de Diretórios

```
use-cases/
└── {entity}/
    └── {action}/
        ├── {action}.use-case.ts    # Lógica principal
        ├── index.ts                 # Exports
        └── dtos/
            ├── {action}.input.ts   # Tipo de entrada
            ├── {action}.output.ts  # Tipo de saída
            └── index.ts
```

#### Padrão de Use Case

```typescript
// src/modules/lead/application/use-cases/lead-category/create/create-category.use-case.ts
@Injectable()
export class CreateCategoryUseCase {
  @Inject('ILeadCategoryRepository')
  private readonly repo: ILeadCategoryRepository

  async execute(
    input: CreateCategoryInput
  ): Promise<ModelOutput<CreateCategoryOutput>> {
    try {
      // 1. Validar entrada (formato)
      const validationErrors = CreateLeadCategoryDtoValidator.validate(input)
      if (Object.keys(validationErrors).length !== 0) {
        return new ModelOutput({
          data: null,
          hasError: true,
          error: validationErrors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // 2. Regras de negócio (unicidade)
      const nameExists = await this.repo.existsByName(input.name)
      if (nameExists) {
        return new ModelOutput({
          data: null,
          hasError: true,
          error: { name: ['Category with this name already exists'] },
          statusCode: HttpStatus.CONFLICT
        })
      }

      // 3. Criar entidade de domínio
      const entity = LeadCategoryEntity.create({
        name: input.name,
        description: input.description,
        priority: input.priority ?? 3,
        scoreBonus: input.scoreBonus ?? 0,
        keywords: input.keywords ?? [],
        color: input.color ?? 'gray'
      })

      // 4. Verificar erros de domínio
      if (entity.notification?.hasError()) {
        return new ModelOutput({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      // 5. Persistir via mapper
      const model = LeadCategoryMapper.toModel(entity)
      await this.repo.save(model)

      // 6. Retornar sucesso
      return new ModelOutput({
        data: LeadCategoryMapper.entityToOutput(entity),
        hasError: false,
        error: null,
        statusCode: HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
```

#### ModelOutput

Estrutura padrão de resposta de use cases:

```typescript
// src/modules/core/application/use-cases/common/model.output.ts
export class ModelOutput<T = null> {
  createdAt: Date // timestamp da resposta
  hasError: boolean // indica se houve erro
  ok: boolean // inverso de hasError
  error: any // detalhes do erro { field: ['messages'] }
  data: T // dados de retorno
  statusCode: number // HTTP status code

  constructor({ hasError, data, error, statusCode = 200 }) {
    this.createdAt = new Date()
    this.hasError = hasError
    this.ok = !hasError
    this.data = data
    this.error = error
    this.statusCode = statusCode
  }
}

// Para listas
export class ModelCollectionOutput<T> extends ModelOutput<T[]> {
  totalItems: number

  constructor(props) {
    super(props)
    this.totalItems = props.data?.length ?? 0
  }
}
```

### 3. Mappers

Mappers convertem entre as camadas (Entity ↔ Model ↔ Output).

```typescript
// src/modules/lead/application/mappers/category-lead.mapper.ts
export class LeadCategoryMapper {
  /**
   * Model (banco) → Entity (domínio)
   * Usado quando lê do banco e precisa aplicar lógica de domínio
   */
  static toEntity(model: LeadCategoryModel): LeadCategoryEntity {
    return LeadCategoryEntity.reconstitute({
      id: new LeadCategoryId(model.id),
      name: NameVO.create(model.name),
      slug: SlugVO.create(model.slug),
      description: model.description ?? '',
      priority: PriorityVO.create(model.priority),
      scoreBonus: ScoreBonusVO.create(model.score_bonus),
      keywords: KeywordsVO.create(
        model.keywords?.split(',').filter(k => k.trim()) ?? []
      ),
      color: CategoryColorVO.create(model.color),
      is_active: model.isActive,
      is_deleted: model.isDeleted,
      is_blocked: model.isBlocked,
      created_at: model.createdAt,
      updated_at: model.updatedAt ?? undefined
    })
  }

  /**
   * Entity (domínio) → Model (banco)
   * Usado quando persiste entidade no banco
   */
  static toModel(entity: LeadCategoryEntity): NewLeadCategoryModel {
    return {
      id: entity.id.id,
      name: entity._name.value,
      slug: entity._slug.value,
      description: entity._description ?? null,
      priority: entity._priority.value,
      score_bonus: entity._scoreBonus.value,
      keywords: entity._keywords.items.map(k => k.value).join(','),
      color: entity._color.value
    }
  }

  /**
   * Model (banco) → Output (resposta)
   * Usado em listagens diretas do banco
   */
  static toOutput(model: LeadCategoryModel): LeadCategoryOutput {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      description: model.description ?? '',
      priority: model.priority,
      scoreBonus: model.score_bonus,
      keywords: model.keywords?.split(',').filter(k => k.trim()) ?? [],
      color: model.color,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt ?? undefined
    }
  }

  /**
   * Entity (domínio) → Output (resposta)
   * Usado quando já tem entidade carregada
   */
  static entityToOutput(entity: LeadCategoryEntity): LeadCategoryOutput {
    return {
      id: entity.id.id,
      name: entity._name.value,
      slug: entity._slug.value,
      description: entity._description ?? '',
      priority: entity._priority.value,
      scoreBonus: entity._scoreBonus.value,
      keywords: entity._keywords.items.map(k => k.value),
      color: entity._color.value,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at ?? undefined
    }
  }
}
```

### 4. Controllers

Controllers delegam para use cases e formatam respostas HTTP.

```typescript
// src/modules/lead/application/controllers/lead-category.controller.ts
@ApiTags('Lead Categories')
@Controller('lead-categories')
export class LeadCategoryController {
  @Inject(CreateCategoryUseCase)
  private readonly createCategoryUseCase: CreateCategoryUseCase

  @Inject(ListCategoryUseCase)
  private readonly listCategoryUseCase: ListCategoryUseCase

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async create(@Body() dto: CreateLeadCategoryDto, @Res() res: Response) {
    const result = await this.createCategoryUseCase.execute({
      name: dto.name,
      description: dto.description,
      priority: dto.priority,
      scoreBonus: dto.scoreBonus,
      keywords: dto.keywords,
      color: dto.color
    })

    // StatusCode vem do use case
    return res.status(result.statusCode).json(result)
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  async findAll(@Res() res: Response) {
    const result = await this.listCategoryUseCase.execute()
    return res.status(result.statusCode).json(result)
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.getCategoryByIdUseCase.execute(id)
    return res.status(result.statusCode).json(result)
  }
}
```

---

## Injeção de Dependência

### 1. Provider Pattern

Providers organizam o registro de dependências por domínio.

```typescript
// src/modules/lead/infra/providers/lead-category.provider.ts
const REPOSITORY_PROVIDERS = {
  ILeadCategoryRepository: {
    provide: 'ILeadCategoryRepository', // Token string para interface
    useClass: LeadCategoryRepository // Implementação concreta
  }
} as const

const USE_CASES_PROVIDERS = {
  CreateCategoryUseCase: {
    provide: CreateCategoryUseCase, // Token é a própria classe
    useClass: CreateCategoryUseCase
  },
  ListCategoryUseCase: {
    provide: ListCategoryUseCase,
    useClass: ListCategoryUseCase
  }
  // ...
} as const

export const LEAD_CATEGORY_PROVIDERS = {
  REPOSITORY_PROVIDERS,
  USE_CASES_PROVIDERS
}
```

### 2. Registro no Módulo

```typescript
// src/modules/lead/lead.module.ts
@Module({
  controllers: [LeadController, LeadCategoryController],
  providers: [
    LeadService,
    // Spread dos providers
    ...Object.values(LEAD_CATEGORY_PROVIDERS.REPOSITORY_PROVIDERS),
    ...Object.values(LEAD_CATEGORY_PROVIDERS.USE_CASES_PROVIDERS),
    ...Object.values(LEAD_PROVIDERS.REPOSITORY_PROVIDERS),
    ...Object.values(LEAD_PROVIDERS.USE_CASES_PROVIDERS)
  ]
})
export class LeadModule {}
```

### 3. Injeção nos Use Cases

```typescript
@Injectable()
export class CreateLeadUseCase {
  // Interface - usa token string
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ILeadCategoryRepository')
  private readonly categoryRepo: ILeadCategoryRepository
}

// Controller - usa classe diretamente
export class LeadController {
  @Inject(CreateLeadUseCase)
  private readonly createLeadUseCase: CreateLeadUseCase
}
```

### 4. Database Module (Global)

```typescript
// src/modules/database/database.module.ts
export const DRIZZLE = Symbol('DRIZZLE')
export const PG_POOL = Symbol('PG_POOL')

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        return new Pool({
          connectionString: env.get('DATABASE_URL')
        })
      }
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool)
    }
  ],
  exports: [DRIZZLE, PG_POOL]
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end()
  }
}
```

---

## Testes

### 1. Fake Builders

Builders fluentes para criar dados de teste.

```typescript
// src/modules/lead/tests/lead-category.fake-builder.ts
export class LeadCategoryFakeBuilder<TBuild = any> {
  private _name: ((index: number) => string) | string
  private _priority: ((index: number) => number) | number
  private countObjs: number

  private constructor(countObjs = 1) {
    this.countObjs = countObjs
    // Valores padrão usando Chance.js
    this._name = () => chance.company()
    this._priority = () => chance.integer({ min: 1, max: 5 })
  }

  // Construtores estáticos
  static aCategory() {
    return new LeadCategoryFakeBuilder<LeadCategoryEntity>()
  }

  static theCategories(count: number) {
    return new LeadCategoryFakeBuilder<LeadCategoryEntity[]>(count)
  }

  // Fluent API
  withName(value: string | ((index: number) => string)) {
    this._name = value
    return this
  }

  withPriority(value: number | ((index: number) => number)) {
    this._priority = value
    return this
  }

  // Métodos de conveniência
  highPriority() {
    return this.withPriority(1)
  }

  inactive() {
    return this.withIsActive(false)
  }

  deleted() {
    return this.withIsDeleted(true)
  }

  // Build
  build(): TBuild {
    const entities = Array.from({ length: this.countObjs }, (_, index) => {
      return LeadCategoryEntity.reconstitute({
        id: new LeadCategoryId(this.callFactory(this._id, index)),
        name: NameVO.create(this.callFactory(this._name, index)),
        priority: PriorityVO.create(this.callFactory(this._priority, index))
        // ...
      })
    })

    return (this.countObjs === 1 ? entities[0] : entities) as TBuild
  }

  private callFactory<T>(value: T | ((index: number) => T), index: number): T {
    return typeof value === 'function' ? (value as Function)(index) : value
  }
}
```

#### Uso nos Testes

```typescript
// Criar uma categoria
const category = LeadCategoryFakeBuilder.aCategory()
  .withName('Marketing')
  .highPriority()
  .build()

// Criar várias
const categories = LeadCategoryFakeBuilder.theCategories(5)
  .withPriority(i => i + 1) // 1, 2, 3, 4, 5
  .build()

// Lead pronto para outreach
const lead = LeadFakeBuilder.aLead()
  .hot()
  .readyForOutreach()
  .withDecisionMaker()
  .build()
```

### 2. Estrutura de Testes

```
tests/modules/lead/
├── domain/
│   ├── entities/
│   │   ├── lead.entity.spec.ts
│   │   └── lead-category.entity.spec.ts
│   └── valueObject/
│       ├── email-vo.spec.ts
│       ├── phone-vo.spec.ts
│       └── ...
├── application/
│   ├── dto/
│   │   ├── create-lead-category.dto.spec.ts
│   │   └── id-param.dto.spec.ts
│   └── usecases/
│       ├── lead-category/
│       │   ├── create/
│       │   ├── list/
│       │   ├── get-by-id/
│       │   ├── update/
│       │   └── delete/
│       └── lead/
└── infra/
    └── repositories/
        ├── lead-category-in-memory.repository.ts
        ├── lead-category-in-memory.repository.spec.ts
        └── lead-category.repository.integration.spec.ts
```

### 3. Teste de Use Case

```typescript
// tests/modules/lead/application/usecases/lead-category/create/create-category.use-case.spec.ts
describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase
  let repository: jest.Mocked<ILeadCategoryRepository>

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ILeadCategoryRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByName: jest.fn()
      // ...
    }

    const module = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        {
          provide: 'ILeadCategoryRepository',
          useValue: mockRepository
        }
      ]
    }).compile()

    useCase = module.get(CreateCategoryUseCase)
    repository = module.get('ILeadCategoryRepository')
  })

  it('should create category successfully', async () => {
    repository.existsByName.mockResolvedValue(false)

    const result = await useCase.execute({
      name: 'Marketing',
      priority: 1
    })

    expect(result.hasError).toBe(false)
    expect(result.statusCode).toBe(HttpStatus.CREATED)
    expect(result.data.name).toBe('Marketing')
    expect(repository.save).toHaveBeenCalled()
  })

  it('should return error when name already exists', async () => {
    repository.existsByName.mockResolvedValue(true)

    const result = await useCase.execute({ name: 'Existing' })

    expect(result.hasError).toBe(true)
    expect(result.statusCode).toBe(HttpStatus.CONFLICT)
    expect(result.error.name).toBeDefined()
  })

  it('should validate input', async () => {
    const result = await useCase.execute({ name: '' })

    expect(result.hasError).toBe(true)
    expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(repository.save).not.toHaveBeenCalled()
  })
})
```

---

## Fluxo de Dados Completo

### Exemplo: Criar um Lead

```
1. HTTP Request
   POST /leads
   Body: { companyName, leadCategoryId, source, ... }

2. Controller
   LeadController.create(dto, res)
   └── Extrai campos do DTO
   └── Chama createLeadUseCase.execute(input)

3. Use Case
   CreateLeadUseCase.execute(input)
   ├── CreateLeadDtoValidator.validate(input)
   │   └── Retorna erros de formato (400)
   ├── categoryRepo.exists(leadCategoryId)
   │   └── Categoria não existe (404)
   ├── repo.existsByCompanyName(companyName)
   │   └── Nome já existe (409)
   ├── repo.existsByEmail(email)
   │   └── Email já existe (409)
   ├── LeadEntity.create(command)
   │   └── Cria VOs (EmailVO, PhoneVO, AddressVO)
   │   └── Inicializa score, enrichmentStatus, stage
   ├── entity.notification.hasError()
   │   └── Erros de domínio (400)
   ├── LeadMapper.toModel(entity)
   │   └── Converte VOs para JSON
   ├── repo.save(model)
   │   └── INSERT no PostgreSQL
   └── ModelOutput { data, statusCode: 201 }

4. Controller
   res.status(result.statusCode).json(result)

5. HTTP Response
   201 Created
   {
     "createdAt": "2024-...",
     "hasError": false,
     "ok": true,
     "data": { id, companyName, ... },
     "statusCode": 201
   }
```

---

## Convenções e Boas Práticas

### Nomenclatura

| Tipo                 | Padrão                    | Exemplo                  |
| -------------------- | ------------------------- | ------------------------ |
| Entity               | `{Name}Entity`            | `LeadEntity`             |
| Value Object         | `{Name}VO`                | `EmailVO`, `LeadScoreVO` |
| Repository Interface | `I{Name}Repository`       | `ILeadRepository`        |
| Repository Impl      | `{Name}Repository`        | `LeadRepository`         |
| Use Case             | `{Action}{Entity}UseCase` | `CreateLeadUseCase`      |
| DTO                  | `{Action}{Entity}Dto`     | `CreateLeadDto`          |
| Mapper               | `{Entity}Mapper`          | `LeadMapper`             |
| Provider             | `{ENTITY}_PROVIDERS`      | `LEAD_PROVIDERS`         |
| Schema               | `{Entity}Schema`          | `LeadSchema`             |
| Model Type           | `{Entity}Model`           | `LeadModel`              |

### Organização de Imports

```typescript
// 1. NestJS/Node
import { Injectable, HttpStatus } from '@nestjs/common'

// 2. Módulos internos (@modules/...)
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadEntity } from '@modules/lead/domain/entities'

// 3. Relativos do mesmo módulo
import { CreateLeadInput } from './dtos'
```

### Responsabilidades por Camada

| Camada           | Responsabilidade                                    | Não deve fazer                              |
| ---------------- | --------------------------------------------------- | ------------------------------------------- |
| **Controller**   | Receber request, chamar use case, formatar response | Lógica de negócio, acesso a banco           |
| **Use Case**     | Orquestrar fluxo, validar, aplicar regras           | Saber sobre HTTP, acessar banco diretamente |
| **Entity**       | Encapsular estado e comportamento de domínio        | Saber sobre persistência, validar DTOs      |
| **Value Object** | Validar e encapsular valores imutáveis              | Ter identidade, mutar estado                |
| **Repository**   | Persistir e recuperar agregados                     | Lógica de negócio, validação                |
| **Mapper**       | Converter entre camadas                             | Lógica de negócio, validação                |

---

## Referência Rápida

### Criar novo módulo de domínio

1. Criar estrutura de diretórios
2. Definir enums em `domain/enums/`
3. Criar Value Objects em `domain/valueObject/`
4. Criar Entity em `domain/entities/`
5. Criar Schema Drizzle em `domain/models/`
6. Definir interface em `domain/repositories/`
7. Criar Mapper em `application/mappers/`
8. Criar DTOs em `application/dtos/`
9. Criar Use Cases em `application/use-cases/`
10. Criar Controller em `application/controllers/`
11. Implementar Repository em `infra/repositories/`
12. Criar Provider em `infra/providers/`
13. Registrar no Module
14. Criar Fake Builder em `tests/`
15. Escrever testes

### Criar novo Use Case

```bash
# Estrutura
src/modules/{module}/application/use-cases/{entity}/{action}/
├── {action}.use-case.ts
├── index.ts
└── dtos/
    ├── {action}.input.ts
    ├── {action}.output.ts
    └── index.ts
```

1. Definir Input/Output interfaces
2. Criar use case class com `@Injectable()`
3. Injetar repositórios necessários
4. Implementar `execute()` retornando `ModelOutput<T>`
5. Registrar no provider
6. Escrever testes
