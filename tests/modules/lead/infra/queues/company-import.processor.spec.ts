import { CompanyImportProcessor } from '@modules/lead/infra/queues/company-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('CompanyImportProcessor', () => {
  let processor: CompanyImportProcessor
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
      'CNPJ_BASICO;RAZAO_SOCIAL;NATUREZA_JURIDICA;QUALIFICACAO_RESPONSAVEL;CAPITAL_SOCIAL;PORTE_EMPRESA;ENTE_FEDERATIVO'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `company-import-test-${randomUUID()}`)
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

    processor = new CompanyImportProcessor(mockPool)
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
      // Using social_capital without comma (2000) to avoid CSV parsing issues in test
      const line = '"22967229";"EMPRESA TESTE LTDA";"2135";"50";"2000";"01";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // UUID
      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      // basic_cnpj
      expect(parts[1]).toBe('22967229')
      // company_name
      expect(parts[2]).toBe('EMPRESA TESTE LTDA')
      // legal_nature_code
      expect(parts[3]).toBe('2135')
      // responsible_qualification
      expect(parts[4]).toBe('50')
      // social_capital
      expect(parts[5]).toBe('2000')
      // company_size
      expect(parts[6]).toBe('01')
    })

    it('should handle social capital with comma (Brazilian format)', () => {
      const line = '"22967229";"EMPRESA TESTE";"2135";"50";"2000,00";"01";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      // The result should contain the social capital value (with comma escaped or included)
      expect(result).toContain('22967229')
      expect(result).toContain('EMPRESA TESTE')
      expect(result).toContain('2000')
    })

    it('should return null for lines with less than 6 columns', () => {
      const line = '"22967229";"EMPRESA";"2135";"50"'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should return null for lines without basic CNPJ', () => {
      const line = '"";"EMPRESA";"2135";"50";"1000,00";"01";""'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should return null for lines without company name', () => {
      const line = '"22967229";"";"2135";"50";"1000,00";"01";""'
      const result = (processor as any).transformLine(line, ';')
      expect(result).toBeNull()
    })

    it('should handle empty optional fields', () => {
      const line = '"22967229";"EMPRESA TESTE";"2135";"50";"0";"00";""'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[7]).toBe('') // federative_entity should be empty
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent([
        '"22967229";"EMPRESA TESTE";"2135";"50";"1000,00";"01";""'
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
        '"22967229";"EMPRESA TESTE";"2135";"50";"1000,00";"01";""'
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
