import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import {
  SearchLeadsByCriteriaInput,
  SearchLeadsByCriteriaOutput,
  SearchLeadResult
} from './dtos'

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

      // TODO: Implementar filtros adicionais (sector, region, size, etc.)
      // Esses filtros serão aplicados sobre os resultados ou farão queries adicionais
      // quando tivermos os dados necessários nas tabelas

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

  private async searchByCnpj(cnpj: string): Promise<SearchLeadResult | null> {
    // Primeiro verifica se já existe como lead no CRM
    const existingLead = await this.leadRepository.findByCnpj(cnpj)

    // Busca dados completos na base da Receita Federal
    const rawData = await this.leadRepository.findByCnpjRaw(cnpj)

    if (!rawData) {
      return null
    }

    return SearchLeadsByCriteriaOutput.fromCnpjRawData(
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
        SearchLeadsByCriteriaOutput.fromCnpjRawData(
          rawData,
          existingLead !== null,
          existingLead?.id
        )
      )
    }

    return results
  }
}
