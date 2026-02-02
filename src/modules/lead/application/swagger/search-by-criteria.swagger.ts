import { HttpStatus } from '@nestjs/common'
import {
  ApiBodyOptions,
  ApiOperationOptions,
  ApiResponseOptions
} from '@nestjs/swagger'
import { SearchLeadsByCriteriaInput } from '../use-cases/lead'

export const SearchByCriteriaSwagger = {
  operation: {
    summary: 'Buscar leads por critérios',
    description:
      'Busca leads na base da Receita Federal por CNPJ, nome da empresa ou outros critérios. ' +
      'Prioriza busca por CNPJ quando fornecido. Retorna dados completos incluindo endereço e sócios.'
  } as ApiOperationOptions,

  body: {
    type: SearchLeadsByCriteriaInput,
    examples: {
      byCnpj: {
        summary: 'Busca por CNPJ',
        value: {
          companyIdentifier: {
            cnpj: '12345678000190'
          }
        }
      },
      byName: {
        summary: 'Busca por nome da empresa',
        value: {
          companyIdentifier: {
            companyName: 'COMERCIO'
          },
          limit: 10
        }
      },
      fullSearch: {
        summary: 'Busca completa com filtros',
        value: {
          companyIdentifier: {
            companyName: 'TECNOLOGIA'
          },
          sectorFilter: {
            sector: 'technology',
            region: 'sudeste',
            size: 'medium'
          },
          advancedFilter: {
            revenueMin: '100000',
            revenueMax: '1000000',
            employeesMin: '10',
            employeesMax: '50',
            foundationYear: '2020',
            keywords: 'software, saas'
          },
          limit: 20
        }
      }
    }
  } as ApiBodyOptions,

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Leads encontrados com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source: { type: 'string', example: 'receita_federal' },
                    existsAsLead: { type: 'boolean', example: false },
                    leadId: { type: 'string', nullable: true },
                    basicCnpj: { type: 'string', example: '12345678' },
                    fullCnpj: { type: 'string', example: '12345678000190' },
                    companyName: {
                      type: 'string',
                      example: 'EMPRESA TESTE LTDA'
                    },
                    tradeName: { type: 'string', nullable: true },
                    phone: { type: 'string', nullable: true },
                    email: { type: 'string', nullable: true },
                    address: {
                      type: 'object',
                      properties: {
                        street: { type: 'string', nullable: true },
                        city: { type: 'string', nullable: true },
                        state: { type: 'string', nullable: true }
                      }
                    },
                    partners: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          doc: { type: 'string' },
                          qualification: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              total: { type: 'number', example: 5 },
              hasMore: { type: 'boolean', example: false }
            }
          },
          hasError: { type: 'boolean', example: false },
          error: { type: 'object', nullable: true },
          statusCode: { type: 'number', example: 200 }
        }
      }
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Parâmetros de busca inválidos'
    } as ApiResponseOptions,

    internalError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Erro ao buscar leads'
    } as ApiResponseOptions
  }
}
