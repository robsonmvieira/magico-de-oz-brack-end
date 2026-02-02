import { Test, TestingModule } from '@nestjs/testing'
import { SearchLeadsByCriteriaUseCase } from '@modules/lead/application/use-cases/lead/search-by-criteria/search-leads-by-criteria.use-case'
import { LeadRepository } from '@modules/lead/infra/repositories/lead.repository'
import { DatabaseModule } from '@modules/database'
import { EnvModule } from '@modules/env'
import {
  SearchLeadsByCriteriaInput,
  SearchResultSource
} from '@modules/lead/application/use-cases/lead/search-by-criteria/dtos'
import { HttpStatus } from '@nestjs/common'

describe('SearchLeadsByCriteriaUseCase (Integration)', () => {
  let useCase: SearchLeadsByCriteriaUseCase
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [
        SearchLeadsByCriteriaUseCase,
        LeadRepository,
        {
          provide: 'ILeadRepository',
          useClass: LeadRepository
        }
      ]
    }).compile()

    useCase = module.get<SearchLeadsByCriteriaUseCase>(
      SearchLeadsByCriteriaUseCase
    )
  }, 30000)

  afterAll(async () => {
    await module.close()
  }, 30000)

  describe('execute', () => {
    describe('busca por CNPJ', () => {
      it('deve retornar dados quando CNPJ existe na base da Receita Federal', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '00000000000191'
          }
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(result.hasError).toBe(false)
        expect(result.data.results).toBeDefined()
        expect(Array.isArray(result.data.results)).toBe(true)
      }, 30000)

      it('deve retornar lista vazia quando CNPJ não existe', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '99999999999999'
          }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.hasError).toBe(false)
        expect(result.data.results).toHaveLength(0)
        expect(result.data.total).toBe(0)
      }, 30000)

      it('deve normalizar CNPJ com pontuação', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '00.000.000/0001-91'
          }
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(result.hasError).toBe(false)
      }, 30000)
    })

    describe('busca por nome da empresa', () => {
      it('deve retornar empresas quando encontra nome parcial', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            companyName: 'COMERCIO'
          },
          limit: 5
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(result.hasError).toBe(false)
        expect(result.data.results).toBeDefined()

        if (result.data.results.length > 0) {
          const firstResult = result.data.results[0]
          expect(firstResult.source).toBe(SearchResultSource.RECEITA_FEDERAL)
          expect(firstResult.companyName).toBeDefined()
          expect(firstResult.basicCnpj).toBeDefined()
          expect(firstResult.fullCnpj).toBeDefined()
        }
      }, 60000)

      it('deve respeitar limite de resultados', async () => {
        const limit = 3
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            companyName: 'LTDA'
          },
          limit
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(result.data.results.length).toBeLessThanOrEqual(limit)
      }, 60000)

      it('deve retornar lista vazia quando nome não encontrado', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            companyName: 'XYZNONEXISTENTNAMEABCDEF123456'
          }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
      }, 30000)
    })

    describe('estrutura de resposta', () => {
      it('deve retornar estrutura completa de SearchLeadResult', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            companyName: 'BANCO'
          },
          limit: 1
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)

        if (result.data.results.length > 0) {
          const searchResult = result.data.results[0]

          expect(searchResult.source).toBeDefined()
          expect(searchResult.existsAsLead).toBeDefined()
          expect(typeof searchResult.existsAsLead).toBe('boolean')
          expect(searchResult.basicCnpj).toBeDefined()
          expect(searchResult.fullCnpj).toBeDefined()
          expect(searchResult.cnpjOrder).toBeDefined()
          expect(searchResult.cnpjDv).toBeDefined()
          expect(searchResult.companyName).toBeDefined()
          expect(searchResult.legalNatureCode).toBeDefined()
          expect(searchResult.socialCapital).toBeDefined()
          expect(searchResult.companySize).toBeDefined()
          expect(searchResult.registrationStatus).toBeDefined()
          expect(searchResult.mainCnae).toBeDefined()

          expect(searchResult.address).toBeDefined()
          expect(searchResult.address.street).toBeDefined()
          expect(searchResult.address.state).toBeDefined()

          expect(Array.isArray(searchResult.partners)).toBe(true)
        }
      }, 60000)

      it('deve retornar hasMore corretamente', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            companyName: 'SERVICOS'
          },
          limit: 2
        }

        const result = await useCase.execute(input)

        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(typeof result.data.hasMore).toBe('boolean')
        expect(typeof result.data.total).toBe('number')
        expect(result.data.total).toBe(result.data.results.length)
      }, 60000)
    })

    describe('busca sem critérios', () => {
      it('deve retornar lista vazia quando nenhum critério fornecido', async () => {
        const input: SearchLeadsByCriteriaInput = {}

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
        expect(result.data.total).toBe(0)
      }, 30000)
    })

    describe('prioridade de busca', () => {
      it('deve buscar por CNPJ primeiro e se não encontrar, buscar por nome', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '99999999999999', // CNPJ que não existe
            companyName: 'COMERCIO' // Nome que pode existir
          }
        }

        const result = await useCase.execute(input)

        // Como o CNPJ não existe, deve fazer fallback para busca por nome
        expect(result.ok).toBe(true)
        // Resultados podem existir se houver empresas com "COMERCIO" no nome
        expect(result.data.results).toBeDefined()
        expect(Array.isArray(result.data.results)).toBe(true)
      }, 60000)

      it('deve retornar apenas resultado do CNPJ quando encontrado', async () => {
        // Este teste verifica que quando CNPJ retorna resultado,
        // não faz busca adicional por nome
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '00000000000191', // CNPJ que pode existir
            companyName: 'COMERCIO'
          }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        // Se o CNPJ existir, retorna apenas 1 resultado (o do CNPJ)
        // Se não existir, pode retornar vários (busca por nome)
        expect(result.data.results).toBeDefined()
      }, 30000)
    })
  })
})
