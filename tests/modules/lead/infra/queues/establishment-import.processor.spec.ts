import { EstablishmentImportProcessor } from '@modules/lead/infra/queues/establishment-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('EstablishmentImportProcessor', () => {
  let processor: EstablishmentImportProcessor
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
    const header =
      'CNPJ_BASICO;CNPJ_ORDEM;CNPJ_DV;MATRIZ_FILIAL;NOME_FANTASIA;SITUACAO_CADASTRAL;DATA_SITUACAO;MOTIVO_SITUACAO;CIDADE_EXTERIOR;PAIS;DATA_INICIO;CNAE_PRINCIPAL;CNAE_SECUNDARIO;TIPO_LOGRADOURO;LOGRADOURO;NUMERO;COMPLEMENTO;BAIRRO;CEP;UF;MUNICIPIO;DDD1;TELEFONE1;DDD2;TELEFONE2;DDD_FAX;FAX;EMAIL;SITUACAO_ESPECIAL;DATA_SITUACAO_ESPECIAL'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `establishment-import-test-${randomUUID()}`)
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

    processor = new EstablishmentImportProcessor(mockPool)
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist
    }
  })

  describe('transformLine', () => {
    it('should correctly parse CSV line with all fields', () => {
      // Example from PDF: "73406951";"0001";"39";"1";"QUATTRO RENT A CAR";"04";"20190116";"63";"";"";"19930928";"7711000";"7739099,4923002,4929902,4930202,7820500";"RUA";"JUNIOR ROCHA";"1075";"";"PARQUE MANIBURA";"60821585";"CE";"1389";"85";"88061568";"85";"88061568";"85";"88061568";"";"";""
      const line =
        '"73406951";"0001";"39";"1";"QUATTRO RENT A CAR";"04";"20190116";"63";"";"";"19930928";"7711000";"7739099,4923002,4929902,4930202,7820500";"RUA";"JUNIOR ROCHA";"1075";"";"PARQUE MANIBURA";"60821585";"CE";"1389";"85";"88061568";"85";"88061568";"85";"88061568";"";"";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // UUID
      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      // basic_cnpj
      expect(parts[1]).toBe('73406951')
      // cnpj_order
      expect(parts[2]).toBe('0001')
      // cnpj_dv
      expect(parts[3]).toBe('39')
      // branch_type
      expect(parts[4]).toBe('1')
      // trade_name
      expect(parts[5]).toBe('QUATTRO RENT A CAR')
      // registration_status
      expect(parts[6]).toBe('04')
      // main_cnae
      expect(parts[12]).toBe('7711000')
    })

    it('should handle line with secondary CNAEs containing commas', () => {
      const line =
        '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"7711000";"7739099,4923002";"RUA";"TEST";"100";"";"";"12345678";"SP";"1234";"11";"12345678";"";"";"";"";"test@test.com";"";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      expect(result).toContain('7711000')
      // Secondary CNAEs should be escaped since they contain comma
      expect(result).toContain('"7739099,4923002"')
    })

    it('should return null for lines with less than 12 columns', () => {
      const line = '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";""'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should return null for lines without basic CNPJ', () => {
      const line =
        '"";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should return null for lines without main CNAE', () => {
      const line =
        '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should handle empty optional fields', () => {
      const line =
        '"73406951";"0001";"39";"1";"";"02";"";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[5]).toBe('') // trade_name empty
    })

    it('should convert email to lowercase', () => {
      // Email is at position 27 (0-indexed). Total 30 fields.
      // 0-11: basicCnpj, cnpjOrder, cnpjDv, branchType, tradeName, regStatus, regDate, regReason, foreignCity, country, activityDate, mainCnae
      // 12-26: secondaryCnaes, streetType, street, number, complement, neighborhood, zip, state, city, ddd1, phone1, ddd2, phone2, faxDdd, fax
      // 27-29: email, specialSituation, specialSituationDate
      const line =
        '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"TEST@EMAIL.COM";"";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      expect(result).toContain('test@email.com')
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent([
        '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""'
      ])
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
      const csvContent = createCsvContent([
        '"73406951";"0001";"39";"1";"TEST";"02";"20190116";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""'
      ])
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
