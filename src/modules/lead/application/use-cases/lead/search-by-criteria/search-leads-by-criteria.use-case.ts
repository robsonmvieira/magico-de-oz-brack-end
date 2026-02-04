import { HttpStatus, Inject, Injectable } from '@nestjs/common'
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
  @Inject('ILeadRepository')
  private readonly leadRepository: ILeadRepository

  async execute(
    input: SearchLeadsByCriteriaInput
  ): Promise<ModelOutput<SearchLeadsByCriteriaOutput>> {
    try {
      const limit = input.limit ?? 50
      const results: SearchLeadResult[] = []

      // Busca por CNPJ (prioridade máxima - retorno único)
      if (input.companyIdentifier?.cnpj) {
        const cnpjResult = await this.searchByCnpj(input.companyIdentifier.cnpj)
        if (cnpjResult) {
          results.push(cnpjResult)
        }
      }

      // Busca por nome da empresa
      if (input.companyIdentifier?.companyName && results.length === 0) {
        const nameResults = await this.searchByCompanyName(
          input.companyIdentifier.companyName,
          limit
        )
        results.push(...nameResults)
      }

      // Busca por critérios (setor, região, porte, filtros avançados) - quando não há busca por identificador
      if (results.length === 0 && this.hasSearchFilter(input)) {
        const criteriaResults = await this.searchByCriteria(input, limit)
        results.push(...criteriaResults)
      }

      const output = new SearchLeadsByCriteriaOutput({
        results,
        total: results.length,
        hasMore: results.length >= limit
      })

      return new ModelOutput<SearchLeadsByCriteriaOutput>({
        data: output,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<SearchLeadsByCriteriaOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Erro ao buscar leads'] },
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

    console.log(
      '[SearchLeadsByCriteriaUseCase] Calling findByCriteriaRaw with filter:',
      JSON.stringify(filter)
    )
    const rawResults = await this.leadRepository.findByCriteriaRaw(filter)
    console.log(
      '[SearchLeadsByCriteriaUseCase] findByCriteriaRaw returned',
      rawResults.length,
      'results'
    )

    const results: SearchLeadResult[] = []

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

    return results
  }
}
