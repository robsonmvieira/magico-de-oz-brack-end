import { PartnerImportProcessor } from '@modules/lead/infra/queues/partner-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('PartnerImportProcessor', () => {
  let processor: PartnerImportProcessor
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
        skipHeader: true,
        ...overrides
      },
      progress: jest.fn().mockResolvedValue(undefined)
    } as any
  }

  const createCsvContent = (lines: string[], includeHeader = true): string => {
    const header =
      'CNPJ_BASICO;IDENTIFICADOR_SOCIO;NOME_SOCIO;CNPJ_CPF_SOCIO;QUALIFICACAO_SOCIO;DATA_ENTRADA;PAIS;REPRESENTANTE_LEGAL;NOME_REPRESENTANTE;QUALIFICACAO_REPRESENTANTE;FAIXA_ETARIA'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `partner-import-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })
  })

  beforeEach(async () => {
    testFilePath = join(tempDir, `test-${randomUUID()}.csv`)

    mockClient = {
      query: jest.fn().mockImplementation((query: any) => {
        if (typeof query === 'object' && query.submit) {
          // pg-copy-streams mock
          return {
            rowCount: 0,
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
          }
        }
        return { rowCount: 0 } as QueryResult
      }),
      release: jest.fn()
    } as any

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    } as any

    processor = new PartnerImportProcessor(mockPool)
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
      const line =
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // UUID
      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      // basic_cnpj (cleaned)
      expect(parts[1]).toBe('17254671')
      // partner_identifier
      expect(parts[2]).toBe('1')
      // partner_name
      expect(parts[3]).toBe('AFYA PARTICIPACOES S.A.')
      // partner_doc
      expect(parts[4]).toBe('23399329000172')
      // partner_qualification
      expect(parts[5]).toBe('22')
      // entry_date
      expect(parts[6]).toBe('2021-08-13')
      // country_code
      expect(parts[7]).toBe('')
      // legal_representative_doc
      expect(parts[8]).toBe('***381497**')
      // legal_representative_name
      expect(parts[9]).toBe('ANIBAL JOSE GRIFO DE SOUSA')
      // legal_representative_qualification
      expect(parts[10]).toBe('05')
      // age_range
      expect(parts[11]).toBe('0')
    })

    it('should handle CNPJ with special characters', () => {
      const line = '17.254.671;1;EMPRESA TESTE;12345678901;22;20210813;;;;;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('17254671')
    })

    it('should handle empty fields', () => {
      const line = '12345678;;NOME DO SOCIO;;;;;;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('12345678') // basic_cnpj
      expect(parts[2]).toBe('') // partner_identifier
      expect(parts[3]).toBe('NOME DO SOCIO') // partner_name
      expect(parts[4]).toBe('') // partner_doc
    })

    it('should return null for lines with less than 4 columns', () => {
      const line = '12345678;1;NOME'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should return null for lines without basic_cnpj', () => {
      const line = ';1;EMPRESA TESTE;12345678901;22;20210813;;;;;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should handle quoted CSV fields', () => {
      const line =
        '"17254671";"1";"AFYA PARTICIPACOES S.A.";"23399329000172";"22";"20210813";"";"";"";"";"0"'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('17254671')
      expect(parts[3]).toBe('AFYA PARTICIPACOES S.A.')
    })

    it('should handle partner with foreign country code', () => {
      const line =
        '12345678;3;SOCIO ESTRANGEIRO;12345678901;22;20210813;105;;;;5'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[2]).toBe('3') // partner_identifier (estrangeiro)
      expect(parts[7]).toBe('105') // country_code
    })
  })

  describe('formatDate', () => {
    it('should format YYYYMMDD to YYYY-MM-DD', () => {
      const result = (processor as any).formatDate('20210813')
      expect(result).toBe('2021-08-13')
    })

    it('should return empty string for empty input', () => {
      expect((processor as any).formatDate('')).toBe('')
      expect((processor as any).formatDate(undefined)).toBe('')
    })

    it('should return original value for non-8-digit dates', () => {
      expect((processor as any).formatDate('2021-08-13')).toBe('2021-08-13')
      expect((processor as any).formatDate('invalid')).toBe('invalid')
    })

    it('should return empty string for invalid dates like 00000000', () => {
      expect((processor as any).formatDate('00000000')).toBe('')
      expect((processor as any).formatDate('00001231')).toBe('')
      expect((processor as any).formatDate('20210000')).toBe('')
      expect((processor as any).formatDate('20211200')).toBe('')
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent([
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Mock the importWithCopy to succeed
      jest.spyOn(processor as any, 'importWithCopy').mockResolvedValue({
        totalProcessed: 1,
        totalImported: 1,
        totalErrors: 0,
        errors: []
      })

      await processor.handleImport(job)

      // Verify file was deleted
      await expect(
        import('node:fs/promises').then(fs => fs.access(testFilePath))
      ).rejects.toThrow()
    })

    it('should delete temp file after failed import', async () => {
      const csvContent = createCsvContent([
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Mock the importWithCopy to fail
      jest
        .spyOn(processor as any, 'importWithCopy')
        .mockRejectedValue(new Error('Database error'))

      await expect(processor.handleImport(job)).rejects.toThrow(
        'Database error'
      )

      // Verify file was still deleted
      await expect(
        import('node:fs/promises').then(fs => fs.access(testFilePath))
      ).rejects.toThrow()
    })

    it('should return correct result structure on success', async () => {
      const csvContent = createCsvContent([
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      jest.spyOn(processor as any, 'importWithCopy').mockResolvedValue({
        totalProcessed: 100,
        totalImported: 95,
        totalErrors: 5,
        errors: []
      })

      const result = await processor.handleImport(job)

      expect(result).toEqual({
        totalProcessed: 100,
        totalImported: 95,
        totalErrors: 5,
        errors: [],
        durationMs: expect.any(Number)
      })
      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CSV column order mapping', () => {
    it('should correctly map Receita Federal CSV format for partners', () => {
      // Format: CNPJ_BASICO;IDENTIFICADOR_SOCIO;NOME_SOCIO;CNPJ_CPF_SOCIO;QUALIFICACAO_SOCIO;DATA_ENTRADA;PAIS;REPRESENTANTE_LEGAL;NOME_REPRESENTANTE;QUALIFICACAO_REPRESENTANTE;FAIXA_ETARIA
      const line =
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // Verify correct mapping
      expect(parts[1]).toBe('17254671') // CNPJ_BASICO -> basic_cnpj
      expect(parts[2]).toBe('1') // IDENTIFICADOR_SOCIO -> partner_identifier
      expect(parts[3]).toBe('AFYA PARTICIPACOES S.A.') // NOME_SOCIO -> partner_name
      expect(parts[4]).toBe('23399329000172') // CNPJ_CPF_SOCIO -> partner_doc
      expect(parts[5]).toBe('22') // QUALIFICACAO_SOCIO -> partner_qualification
      expect(parts[6]).toBe('2021-08-13') // DATA_ENTRADA -> entry_date
      expect(parts[7]).toBe('') // PAIS -> country_code
      expect(parts[8]).toBe('***381497**') // REPRESENTANTE_LEGAL -> legal_representative_doc
      expect(parts[9]).toBe('ANIBAL JOSE GRIFO DE SOUSA') // NOME_REPRESENTANTE -> legal_representative_name
      expect(parts[10]).toBe('05') // QUALIFICACAO_REPRESENTANTE -> legal_representative_qualification
      expect(parts[11]).toBe('0') // FAIXA_ETARIA -> age_range
    })

    it('should handle different partner types', () => {
      // Type 1: Pessoa Jurídica
      const pjLine =
        '12345678;1;EMPRESA TESTE;12345678000199;22;20210101;;;;;;0'
      const pjResult = (processor as any).transformLine(pjLine, ';')
      expect(pjResult).not.toBeNull()
      expect(pjResult.split(',')[2]).toBe('1')

      // Type 2: Pessoa Física
      const pfLine = '12345678;2;JOAO DA SILVA;12345678901;49;20210101;;;;;;5'
      const pfResult = (processor as any).transformLine(pfLine, ';')
      expect(pfResult).not.toBeNull()
      expect(pfResult.split(',')[2]).toBe('2')

      // Type 3: Estrangeiro
      const estLine =
        '12345678;3;FOREIGN PARTNER;PASSPORT123;49;20210101;105;;;;4'
      const estResult = (processor as any).transformLine(estLine, ';')
      expect(estResult).not.toBeNull()
      expect(estResult.split(',')[2]).toBe('3')
    })
  })

  describe('createTransformStream', () => {
    it('should skip header line when skipHeader is true', async () => {
      const csvContent = createCsvContent([
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })
      const stream = (processor as any).createTransformStream(
        testFilePath,
        ';',
        true,
        job
      )

      const lines: string[] = []
      for await (const line of stream) {
        lines.push(line.toString())
      }

      // Should only have one data line (header skipped)
      expect(lines.length).toBe(1)
      expect(lines[0]).not.toContain('CNPJ_BASICO')
    })

    it('should not skip header line when skipHeader is false', async () => {
      const csvContent = createCsvContent(
        [
          '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
        ],
        false
      )
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: false })
      const stream = (processor as any).createTransformStream(
        testFilePath,
        ';',
        false,
        job
      )

      const lines: string[] = []
      for await (const line of stream) {
        lines.push(line.toString())
      }

      expect(lines.length).toBe(1)
    })

    it('should skip empty lines', async () => {
      const csvContent =
        'HEADER\n17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0\n\n\n12345678;2;OUTRO SOCIO;12345678901;49;20210101;;;;;;5'
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })
      const stream = (processor as any).createTransformStream(
        testFilePath,
        ';',
        true,
        job
      )

      const lines: string[] = []
      for await (const line of stream) {
        lines.push(line.toString())
      }

      expect(lines.length).toBe(2)
    })

    it('should report progress every 100000 records', async () => {
      // Create a small file for unit test
      const lines = Array(5)
        .fill(null)
        .map(
          (_, i) =>
            `${String(i + 1).padStart(8, '0')};1;EMPRESA ${i + 1};12345678901;22;20210813;;;;;;0`
        )
      const csvContent = createCsvContent(lines)
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })
      const stream = (processor as any).createTransformStream(
        testFilePath,
        ';',
        true,
        job
      )

      const result: string[] = []
      for await (const line of stream) {
        result.push(line.toString())
      }

      expect(result.length).toBe(5)
      // Progress is called every 100000, so with 5 records it won't be called
      expect(job.progress).not.toHaveBeenCalled()
    })
  })

  describe('importWithCopy', () => {
    it('should call pool.connect and release client', async () => {
      const job = createMockJob()

      const freshMockClient = {
        query: jest.fn().mockRejectedValue(new Error('Test error')),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      await expect(
        (processor as any).importWithCopy(testFilePath, ';', true, job)
      ).rejects.toThrow('Test error')

      expect(mockPool.connect).toHaveBeenCalled()
      expect(freshMockClient.release).toHaveBeenCalled()
    })

    it('should release client in finally block', async () => {
      const job = createMockJob()

      // Create a fresh mock client with a query that fails on first call
      const freshMockClient = {
        query: jest.fn().mockRejectedValueOnce(new Error('Connection error')),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      await expect(
        (processor as any).importWithCopy(testFilePath, ';', true, job)
      ).rejects.toThrow('Connection error')

      // Client should still be released even on error
      expect(freshMockClient.release).toHaveBeenCalled()
    })

    it('should release client on error', async () => {
      const csvContent = createCsvContent([
        '17254671;1;AFYA PARTICIPACOES S.A.;23399329000172;22;20210813;;***381497**;ANIBAL JOSE GRIFO DE SOUSA;05;0'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Create a fresh mock client with a query that fails
      const freshMockClient = {
        query: jest.fn().mockRejectedValue(new Error('Database error')),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      await expect(
        (processor as any).importWithCopy(testFilePath, ';', true, job)
      ).rejects.toThrow('Database error')

      expect(freshMockClient.release).toHaveBeenCalled()
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
        totalImported: 95,
        totalErrors: 5,
        errors: [],
        durationMs: 1000
      }

      processor.onCompleted(job, result)

      expect(loggerSpy).toHaveBeenCalledWith(
        'Job 1 completed successfully: 95 records imported'
      )
    })
  })
})
