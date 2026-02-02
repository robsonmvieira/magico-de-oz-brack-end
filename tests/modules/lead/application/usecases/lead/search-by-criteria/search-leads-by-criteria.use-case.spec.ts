import { SearchLeadsByCriteriaUseCase } from '@modules/lead/application/use-cases/lead/search-by-criteria/search-leads-by-criteria.use-case'
import { CnpjRawData, ILeadRepository } from '@modules/lead/domain/repositories'
import { HttpStatus } from '@nestjs/common'
import {
  SearchLeadsByCriteriaInput,
  SearchResultSource
} from '@modules/lead/application/use-cases/lead/search-by-criteria/dtos'
import { LeadModel } from '@modules/lead/domain/models'

const createMockLeadRepository = (): jest.Mocked<ILeadRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCompanyName: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  findByCategoryId: jest.fn(),
  findByStage: jest.fn(),
  findByTemperature: jest.fn(),
  findActive: jest.fn(),
  findByGooglePlaceId: jest.fn(),
  findByCnpj: jest.fn(),
  findByCnpjRaw: jest.fn(),
  findByCompanyNameRaw: jest.fn(),
  exists: jest.fn(),
  existsByCompanyName: jest.fn(),
  existsByEmail: jest.fn(),
  findByMEI: jest.fn(),
  findSimpleByBasicDoc: jest.fn(),
  createSimple: jest.fn(),
  bulkSimple: jest.fn(),
  bulkSimpleInsert: jest.fn(),
  copySimpleFromStream: jest.fn(),
  findPartnersByBasicCnpj: jest.fn(),
  findPartnerByDoc: jest.fn(),
  createPartner: jest.fn(),
  bulkPartnerInsert: jest.fn(),
  findCountryByCode: jest.fn(),
  findAllCountries: jest.fn(),
  createCountry: jest.fn(),
  bulkCountryInsert: jest.fn(),
  findLegalNatureByCode: jest.fn(),
  findAllLegalNatures: jest.fn(),
  createLegalNature: jest.fn(),
  bulkLegalNatureInsert: jest.fn(),
  findCnaeByCode: jest.fn(),
  findAllCnaes: jest.fn(),
  createCnae: jest.fn(),
  bulkCnaeInsert: jest.fn(),
  findCompanyByBasicCnpj: jest.fn(),
  findAllCompanies: jest.fn(),
  createCompany: jest.fn(),
  bulkCompanyInsert: jest.fn(),
  findEstablishmentByFullCnpj: jest.fn(),
  findEstablishmentsByBasicCnpj: jest.fn(),
  findAllEstablishments: jest.fn(),
  createEstablishment: jest.fn(),
  bulkEstablishmentInsert: jest.fn(),
  findLeadSituationChangeReasonByCode: jest.fn(),
  findAllLeadSituationChangeReasons: jest.fn(),
  createLeadSituationChangeReason: jest.fn(),
  bulkLeadSituationChangeReasonInsert: jest.fn(),
  findMunicipalityByCode: jest.fn(),
  findAllMunicipalities: jest.fn(),
  createMunicipality: jest.fn(),
  bulkMunicipalityInsert: jest.fn(),
  findLeadPartnerQualificationByCode: jest.fn(),
  findAllLeadPartnerQualifications: jest.fn(),
  createLeadPartnerQualification: jest.fn(),
  bulkLeadPartnerQualificationInsert: jest.fn()
})

const createMockCnpjRawData = (
  overrides: Partial<CnpjRawData> = {}
): CnpjRawData => ({
  basicCnpj: '12345678',
  cnpjOrder: '0001',
  cnpjDv: '90',
  companyName: 'EMPRESA TESTE LTDA',
  legalNatureCode: '2062',
  socialCapital: '100000.00',
  companySize: '01',
  tradeName: 'EMPRESA TESTE',
  registrationStatus: '02',
  activityStartDate: '2020-01-15',
  mainCnae: '6201501',
  phone: '11999999999',
  email: 'contato@empresateste.com.br',
  street: 'RUA TESTE',
  number: '123',
  complement: 'SALA 101',
  neighborhood: 'CENTRO',
  zipCode: '01310100',
  state: 'SP',
  cityCode: '3550308',
  cityName: 'SAO PAULO',
  countryCode: '1058',
  countryName: 'BRASIL',
  partners: [
    {
      name: 'JOAO DA SILVA',
      doc: '12345678901',
      qualification: '49'
    }
  ],
  ...overrides
})

const createMockLeadModel = (
  overrides: Partial<LeadModel> = {}
): LeadModel => ({
  id: 'lead-uuid-123',
  companyName: 'EMPRESA TESTE LTDA',
  tradeName: 'EMPRESA TESTE',
  document: '12345678000190',
  email: 'contato@empresateste.com.br',
  phone: '11999999999',
  categoryId: 'category-uuid',
  stage: 'new',
  temperature: 'cold',
  score: 50,
  source: 'manual',
  notes: null,
  addressStreet: 'RUA TESTE',
  addressCity: 'SAO PAULO',
  addressState: 'SP',
  addressZipCode: '01310100',
  addressNeighborhood: 'CENTRO',
  addressLatitude: null,
  addressLongitude: null,
  website: null,
  googlePlaceId: null,
  googleRating: null,
  googleRatingCount: null,
  firstContactAt: null,
  lastContactAt: null,
  nextFollowUpAt: null,
  convertedAt: null,
  lostAt: null,
  lostReason: null,
  sectorType: null,
  sectorSpecificData: null,
  scoreBreakdown: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('SearchLeadsByCriteriaUseCase', () => {
  let useCase: SearchLeadsByCriteriaUseCase
  let leadRepository: jest.Mocked<ILeadRepository>

  beforeEach(() => {
    leadRepository = createMockLeadRepository()

    useCase = new SearchLeadsByCriteriaUseCase()
    ;(useCase as any).leadRepository = leadRepository
  })

  describe('execute', () => {
    describe('busca por CNPJ', () => {
      it('deve retornar resultado quando encontra CNPJ na base raw', async () => {
        const mockRawData = createMockCnpjRawData()
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.hasError).toBe(false)
        expect(result.statusCode).toBe(HttpStatus.OK)
        expect(result.data.results).toHaveLength(1)
        expect(result.data.results[0].fullCnpj).toBe('12345678000190')
        expect(result.data.results[0].existsAsLead).toBe(false)
        expect(result.data.results[0].source).toBe(
          SearchResultSource.RECEITA_FEDERAL
        )
      })

      it('deve indicar que lead já existe no CRM quando encontrado', async () => {
        const mockRawData = createMockCnpjRawData()
        const mockLead = createMockLeadModel()
        leadRepository.findByCnpj.mockResolvedValue(mockLead)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(1)
        expect(result.data.results[0].existsAsLead).toBe(true)
        expect(result.data.results[0].leadId).toBe('lead-uuid-123')
      })

      it('deve retornar lista vazia quando CNPJ não encontrado na base raw', async () => {
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(null)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '00000000000000' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
        expect(result.data.total).toBe(0)
      })

      it('deve chamar repositório com CNPJ correto', async () => {
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(null)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12.345.678/0001-90' }
        }

        await useCase.execute(input)

        expect(leadRepository.findByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90'
        )
        expect(leadRepository.findByCnpjRaw).toHaveBeenCalledWith(
          '12.345.678/0001-90'
        )
      })
    })

    describe('busca por nome da empresa', () => {
      it('deve retornar resultados quando encontra empresas por nome', async () => {
        const mockRawData1 = createMockCnpjRawData()
        const mockRawData2 = createMockCnpjRawData({
          basicCnpj: '98765432',
          cnpjOrder: '0001',
          cnpjDv: '01',
          companyName: 'EMPRESA TESTE 2 LTDA'
        })
        leadRepository.findByCompanyNameRaw.mockResolvedValue([
          mockRawData1,
          mockRawData2
        ])
        leadRepository.findByCnpj.mockResolvedValue(null)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'EMPRESA TESTE' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(2)
        expect(result.data.total).toBe(2)
        expect(result.data.results[0].companyName).toBe('EMPRESA TESTE LTDA')
        expect(result.data.results[1].companyName).toBe('EMPRESA TESTE 2 LTDA')
      })

      it('deve verificar existência de lead para cada resultado', async () => {
        const mockRawData1 = createMockCnpjRawData()
        const mockRawData2 = createMockCnpjRawData({
          basicCnpj: '98765432',
          cnpjOrder: '0001',
          cnpjDv: '01'
        })
        const mockLead = createMockLeadModel()

        leadRepository.findByCompanyNameRaw.mockResolvedValue([
          mockRawData1,
          mockRawData2
        ])
        leadRepository.findByCnpj
          .mockResolvedValueOnce(mockLead) // primeiro resultado existe como lead
          .mockResolvedValueOnce(null) // segundo não existe

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'EMPRESA TESTE' }
        }

        const result = await useCase.execute(input)

        expect(result.data.results[0].existsAsLead).toBe(true)
        expect(result.data.results[0].leadId).toBe('lead-uuid-123')
        expect(result.data.results[1].existsAsLead).toBe(false)
        expect(result.data.results[1].leadId).toBeUndefined()
      })

      it('deve respeitar o limite de resultados', async () => {
        leadRepository.findByCompanyNameRaw.mockResolvedValue([])

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'TESTE' },
          limit: 10
        }

        await useCase.execute(input)

        expect(leadRepository.findByCompanyNameRaw).toHaveBeenCalledWith(
          'TESTE',
          10
        )
      })

      it('deve usar limite padrão de 50 quando não especificado', async () => {
        leadRepository.findByCompanyNameRaw.mockResolvedValue([])

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'TESTE' }
        }

        await useCase.execute(input)

        expect(leadRepository.findByCompanyNameRaw).toHaveBeenCalledWith(
          'TESTE',
          50
        )
      })

      it('deve retornar lista vazia quando nenhuma empresa encontrada', async () => {
        leadRepository.findByCompanyNameRaw.mockResolvedValue([])

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'XYZNONEXISTENT' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
        expect(result.data.total).toBe(0)
        expect(result.data.hasMore).toBe(false)
      })
    })

    describe('prioridade de busca', () => {
      it('deve priorizar CNPJ sobre nome quando ambos são fornecidos', async () => {
        const mockRawData = createMockCnpjRawData()
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '12345678000190',
            companyName: 'OUTRO NOME'
          }
        }

        const result = await useCase.execute(input)

        expect(leadRepository.findByCnpjRaw).toHaveBeenCalledWith(
          '12345678000190'
        )
        expect(leadRepository.findByCompanyNameRaw).not.toHaveBeenCalled()
        expect(result.data.results).toHaveLength(1)
      })

      it('deve buscar por nome quando CNPJ não retorna resultado', async () => {
        const mockRawData = createMockCnpjRawData()
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(null)
        leadRepository.findByCompanyNameRaw.mockResolvedValue([mockRawData])

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {
            cnpj: '00000000000000',
            companyName: 'EMPRESA TESTE'
          }
        }

        const result = await useCase.execute(input)

        expect(leadRepository.findByCnpjRaw).toHaveBeenCalled()
        expect(leadRepository.findByCompanyNameRaw).toHaveBeenCalledWith(
          'EMPRESA TESTE',
          50
        )
        expect(result.data.results).toHaveLength(1)
      })
    })

    describe('mapeamento de dados', () => {
      it('deve mapear todos os campos corretamente do CnpjRawData', async () => {
        const mockRawData = createMockCnpjRawData()
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)
        const searchResult = result.data.results[0]

        expect(searchResult.basicCnpj).toBe('12345678')
        expect(searchResult.cnpjOrder).toBe('0001')
        expect(searchResult.cnpjDv).toBe('90')
        expect(searchResult.fullCnpj).toBe('12345678000190')
        expect(searchResult.companyName).toBe('EMPRESA TESTE LTDA')
        expect(searchResult.tradeName).toBe('EMPRESA TESTE')
        expect(searchResult.legalNatureCode).toBe('2062')
        expect(searchResult.socialCapital).toBe('100000.00')
        expect(searchResult.companySize).toBe('01')
        expect(searchResult.registrationStatus).toBe('02')
        expect(searchResult.activityStartDate).toBe('2020-01-15')
        expect(searchResult.mainCnae).toBe('6201501')
        expect(searchResult.phone).toBe('11999999999')
        expect(searchResult.email).toBe('contato@empresateste.com.br')
      })

      it('deve mapear endereço corretamente', async () => {
        const mockRawData = createMockCnpjRawData()
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)
        const address = result.data.results[0].address

        expect(address.street).toBe('RUA TESTE')
        expect(address.number).toBe('123')
        expect(address.complement).toBe('SALA 101')
        expect(address.neighborhood).toBe('CENTRO')
        expect(address.zipCode).toBe('01310100')
        expect(address.city).toBe('SAO PAULO')
        expect(address.state).toBe('SP')
        expect(address.country).toBe('BRASIL')
      })

      it('deve mapear sócios corretamente', async () => {
        const mockRawData = createMockCnpjRawData({
          partners: [
            { name: 'JOAO DA SILVA', doc: '12345678901', qualification: '49' },
            { name: 'MARIA SANTOS', doc: '98765432100', qualification: '22' }
          ]
        })
        leadRepository.findByCnpj.mockResolvedValue(null)
        leadRepository.findByCnpjRaw.mockResolvedValue(mockRawData)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)
        const partners = result.data.results[0].partners

        expect(partners).toHaveLength(2)
        expect(partners[0].name).toBe('JOAO DA SILVA')
        expect(partners[0].doc).toBe('12345678901')
        expect(partners[0].qualification).toBe('49')
        expect(partners[1].name).toBe('MARIA SANTOS')
      })
    })

    describe('hasMore flag', () => {
      it('deve indicar hasMore true quando resultados atingem o limite', async () => {
        const results = Array(50)
          .fill(null)
          .map((_, i) =>
            createMockCnpjRawData({ basicCnpj: String(i).padStart(8, '0') })
          )
        leadRepository.findByCompanyNameRaw.mockResolvedValue(results)
        leadRepository.findByCnpj.mockResolvedValue(null)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'TESTE' },
          limit: 50
        }

        const result = await useCase.execute(input)

        expect(result.data.hasMore).toBe(true)
      })

      it('deve indicar hasMore false quando resultados abaixo do limite', async () => {
        const results = [createMockCnpjRawData()]
        leadRepository.findByCompanyNameRaw.mockResolvedValue(results)
        leadRepository.findByCnpj.mockResolvedValue(null)

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { companyName: 'TESTE' },
          limit: 50
        }

        const result = await useCase.execute(input)

        expect(result.data.hasMore).toBe(false)
      })
    })

    describe('tratamento de erros', () => {
      it('deve retornar erro quando repositório lança exceção', async () => {
        leadRepository.findByCnpjRaw.mockRejectedValue(
          new Error('Database connection error')
        )

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(false)
        expect(result.hasError).toBe(true)
        expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(result.error.message[0]).toContain('Database connection error')
      })

      it('deve retornar mensagem genérica quando erro não tem mensagem', async () => {
        leadRepository.findByCnpjRaw.mockRejectedValue(new Error())

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(false)
        expect(result.error.message[0]).toBe('Erro ao buscar leads')
      })

      it('deve tratar erro na verificação de lead existente', async () => {
        leadRepository.findByCnpj.mockRejectedValue(
          new Error('Lead lookup failed')
        )

        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: { cnpj: '12345678000190' }
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(false)
        expect(result.hasError).toBe(true)
      })
    })

    describe('busca sem critérios', () => {
      it('deve retornar lista vazia quando nenhum critério é fornecido', async () => {
        const input: SearchLeadsByCriteriaInput = {}

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
        expect(result.data.total).toBe(0)
        expect(leadRepository.findByCnpjRaw).not.toHaveBeenCalled()
        expect(leadRepository.findByCompanyNameRaw).not.toHaveBeenCalled()
      })

      it('deve retornar lista vazia quando companyIdentifier está vazio', async () => {
        const input: SearchLeadsByCriteriaInput = {
          companyIdentifier: {}
        }

        const result = await useCase.execute(input)

        expect(result.ok).toBe(true)
        expect(result.data.results).toHaveLength(0)
      })
    })
  })
})
