import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import {
  ILeadRepository,
  SearchByCriteriaFilter
} from '@modules/lead/domain/repositories'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import {
  SearchLeadsByCriteriaInput,
  SearchLeadsByCriteriaOutput,
  SearchLeadResult
} from './dtos'
import { LeadMapper } from '@modules/lead/application/mappers'

@Injectable()
export class SearchLeadsByCriteriaUseCase {
  private readonly logger = new Logger(SearchLeadsByCriteriaUseCase.name)

  @Inject('ILeadRepository')
  private readonly leadRepository: ILeadRepository

  async execute(
    input: SearchLeadsByCriteriaInput
  ): Promise<ModelOutput<SearchLeadsByCriteriaOutput>> {
    const startTime = Date.now()
    this.logger.log(
      `[execute] Starting search with input: ${JSON.stringify(input)}`
    )

    try {
      const limit = input.limit ?? 50
      const results: SearchLeadResult[] = []

      // Busca por CNPJ (prioridade máxima - retorno único)
      if (input.companyIdentifier?.cnpj) {
        this.logger.log(
          `[execute] Searching by CNPJ: ${input.companyIdentifier.cnpj}`
        )
        const cnpjStart = Date.now()
        const cnpjResult = await this.searchByCnpj(input.companyIdentifier.cnpj)
        this.logger.log(
          `[execute] CNPJ search took ${Date.now() - cnpjStart}ms`
        )
        if (cnpjResult) {
          results.push(cnpjResult)
        }
      }

      // Busca por nome da empresa
      if (input.companyIdentifier?.companyName && results.length === 0) {
        this.logger.log(
          `[execute] Searching by company name: ${input.companyIdentifier.companyName}`
        )
        const nameStart = Date.now()
        const nameResults = await this.searchByCompanyName(
          input.companyIdentifier.companyName,
          limit
        )
        this.logger.log(
          `[execute] Company name search took ${Date.now() - nameStart}ms, found ${nameResults.length} results`
        )
        results.push(...nameResults)
      }

      // Busca por critérios (setor, região, porte, filtros avançados) - quando não há busca por identificador
      if (results.length === 0 && this.hasSearchFilter(input)) {
        this.logger.log(`[execute] Searching by criteria filters`)
        const criteriaStart = Date.now()
        const criteriaResults = await this.searchByCriteria(input, limit)
        this.logger.log(
          `[execute] Criteria search took ${Date.now() - criteriaStart}ms, found ${criteriaResults.length} results`
        )
        results.push(...criteriaResults)
      }

      const output = new SearchLeadsByCriteriaOutput({
        results,
        total: results.length,
        hasMore: results.length >= limit
      })

      this.logger.log(
        `[execute] Total execution time: ${Date.now() - startTime}ms, returning ${results.length} results`
      )

      return new ModelOutput<SearchLeadsByCriteriaOutput>({
        data: output,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : ''
      const errorMessage = rawMessage || 'Erro ao buscar leads'
      const errorStack = error instanceof Error ? error.stack : ''
      this.logger.error(
        `[execute] Error after ${Date.now() - startTime}ms: ${errorMessage}`,
        errorStack
      )

      return new ModelOutput<SearchLeadsByCriteriaOutput>({
        data: null,
        hasError: true,
        error: { message: [errorMessage] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }

  private hasSearchFilter(input: SearchLeadsByCriteriaInput): boolean {
    const sectorFilter = input.sectorFilter
    const advancedFilter = input.advancedFilter
    return !!(
      sectorFilter?.sector ||
      sectorFilter?.region ||
      sectorFilter?.states ||
      sectorFilter?.size ||
      advancedFilter?.term ||
      advancedFilter?.foundationYear ||
      advancedFilter?.keywords
    )
  }

  private async searchByCnpj(cnpj: string): Promise<SearchLeadResult | null> {
    // Primeiro verifica se já existe como lead no CRM
    const existingLead = await this.leadRepository.findByCnpj(cnpj)

    // Busca dados completos na base da Receita Federal
    const rawData = await this.leadRepository.findByCnpjRaw(cnpj)

    if (!rawData) {
      return null
    }

    return LeadMapper.fromCnpjRawData(
      rawData,
      existingLead !== null,
      existingLead?.id
    )
  }

  private async searchByCompanyName(
    companyName: string,
    limit: number
  ): Promise<SearchLeadResult[]> {
    // Busca nas tabelas raw da Receita Federal
    const rawResults = await this.leadRepository.findByCompanyNameRaw(
      companyName,
      limit
    )

    const results: SearchLeadResult[] = []

    for (const rawData of rawResults) {
      // Para cada resultado, verificar se já existe como lead
      const fullCnpj = `${rawData.basicCnpj}${rawData.cnpjOrder}${rawData.cnpjDv}`
      const existingLead = await this.leadRepository.findByCnpj(fullCnpj)

      results.push(
        LeadMapper.fromCnpjRawData(
          rawData,
          existingLead !== null,
          existingLead?.id
        )
      )
    }

    return results
  }

  private async searchByCriteria(
    input: SearchLeadsByCriteriaInput,
    limit: number
  ): Promise<SearchLeadResult[]> {
    // Parse keywords string to array if provided
    const keywords = input.advancedFilter?.keywords
      ? input.advancedFilter.keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0)
      : undefined

    const filter: SearchByCriteriaFilter = {
      sector: input.sectorFilter?.sector,
      region: input.sectorFilter?.region,
      states: input.sectorFilter?.states,
      companySize: input.sectorFilter?.size,
      // Advanced filters
      term: input.advancedFilter?.term,
      foundationYear: input.advancedFilter?.foundationYear,
      keywords,
      limit
    }

    this.logger.log(
      `[searchByCriteria] Calling findByCriteriaRaw with filter: ${JSON.stringify(filter)}`
    )
    const queryStart = Date.now()

    const rawResults = await this.leadRepository.findByCriteriaRaw(filter)

    this.logger.log(
      `[searchByCriteria] findByCriteriaRaw took ${Date.now() - queryStart}ms, returned ${rawResults.length} results`
    )

    const results: SearchLeadResult[] = []
    const mappingStart = Date.now()

    for (const rawData of rawResults) {
      const fullCnpj = `${rawData.basicCnpj}${rawData.cnpjOrder}${rawData.cnpjDv}`
      const existingLead = await this.leadRepository.findByCnpj(fullCnpj)

      results.push(
        LeadMapper.fromCnpjRawData(
          rawData,
          existingLead !== null,
          existingLead?.id
        )
      )
    }

    this.logger.log(
      `[searchByCriteria] Mapping ${rawResults.length} results took ${Date.now() - mappingStart}ms`
    )

    return results
  }
}
