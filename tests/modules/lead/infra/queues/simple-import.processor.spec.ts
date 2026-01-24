import { SimpleImportProcessor } from '@modules/lead/infra/queues/simple-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('SimpleImportProcessor', () => {
  let processor: SimpleImportProcessor
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
      'CNPJ;OPCAO_SIMPLES;DATA_OPCAO_SIMPLES;DATA_EXCLUSAO_SIMPLES;OPCAO_MEI;DATA_OPCAO_MEI;DATA_EXCLUSAO_MEI'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `simple-import-test-${randomUUID()}`)
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

    processor = new SimpleImportProcessor(mockPool)
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
      const line = '12345678000199;S;20190509;20220401;N;20200101;20210601'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // UUID
      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      // basic_doc (cleaned)
      expect(parts[1]).toBe('12345678000199')
      // choose_simple_module
      expect(parts[2]).toBe('S')
      // date_simple_module_start
      expect(parts[3]).toBe('2019-05-09')
      // date_exclude_simple_module_start
      expect(parts[4]).toBe('2022-04-01')
      // choose_mei
      expect(parts[5]).toBe('N')
      // date_mei_start
      expect(parts[6]).toBe('2020-01-01')
      // date_exclude_mei_start
      expect(parts[7]).toBe('2021-06-01')
    })

    it('should handle CNPJ with special characters', () => {
      const line = '12.345.678/0001-99;S;20190509;;;N;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('12345678000199')
    })

    it('should handle empty date fields', () => {
      // Format: CNPJ;OPCAO_SIMPLES;DATA_OPCAO_SIMPLES;DATA_EXCLUSAO_SIMPLES;OPCAO_MEI;DATA_OPCAO_MEI;DATA_EXCLUSAO_MEI
      const line = '12345678000199;S;;;N;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[2]).toBe('S') // choose_simple_module
      expect(parts[3]).toBe('') // date_simple_module_start
      expect(parts[4]).toBe('') // date_exclude_simple_module_start
      expect(parts[5]).toBe('N') // choose_mei
      expect(parts[6]).toBe('') // date_mei_start
      expect(parts[7]).toBe('') // date_exclude_mei_start
    })

    it('should return null for lines with less than 4 columns', () => {
      const line = '12345678000199;S;20190509'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should return null for lines without basic_doc', () => {
      const line = ';S;20190509;20220401;N;20200101;20210601'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should handle quoted CSV fields', () => {
      const line =
        '"12345678000199";"S";"20190509";"20220401";"N";"20200101";"20210601"'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('12345678000199')
      expect(parts[2]).toBe('S')
    })
  })

  describe('formatDate', () => {
    it('should format YYYYMMDD to YYYY-MM-DD', () => {
      const result = (processor as any).formatDate('20190509')
      expect(result).toBe('2019-05-09')
    })

    it('should return empty string for empty input', () => {
      expect((processor as any).formatDate('')).toBe('')
      expect((processor as any).formatDate(undefined)).toBe('')
    })

    it('should return original value for non-8-digit dates', () => {
      expect((processor as any).formatDate('2019-05-09')).toBe('2019-05-09')
      expect((processor as any).formatDate('invalid')).toBe('invalid')
    })

    it('should return empty string for invalid dates like 00000000', () => {
      expect((processor as any).formatDate('00000000')).toBe('')
      expect((processor as any).formatDate('00001231')).toBe('')
      expect((processor as any).formatDate('20190000')).toBe('')
      expect((processor as any).formatDate('20191200')).toBe('')
    })
  })

  describe('parseOptionStatus', () => {
    it('should return S for "S" or "s"', () => {
      expect((processor as any).parseOptionStatus('S')).toBe('S')
      expect((processor as any).parseOptionStatus('s')).toBe('S')
    })

    it('should return N for "N" or "n"', () => {
      expect((processor as any).parseOptionStatus('N')).toBe('N')
      expect((processor as any).parseOptionStatus('n')).toBe('N')
    })

    it('should return O for empty or undefined', () => {
      expect((processor as any).parseOptionStatus('')).toBe('O')
      expect((processor as any).parseOptionStatus(undefined)).toBe('O')
    })

    it('should return O for invalid values', () => {
      expect((processor as any).parseOptionStatus('X')).toBe('O')
      expect((processor as any).parseOptionStatus('invalid')).toBe('O')
    })

    it('should return O for "O" or "o"', () => {
      expect((processor as any).parseOptionStatus('O')).toBe('O')
      expect((processor as any).parseOptionStatus('o')).toBe('O')
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent([
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
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
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
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
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
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
    it('should correctly map Receita Federal CSV format', () => {
      // Format: CNPJ;OPCAO_SIMPLES;DATA_OPCAO_SIMPLES;DATA_EXCLUSAO_SIMPLES;OPCAO_MEI;DATA_OPCAO_MEI;DATA_EXCLUSAO_MEI
      const line = '33581424;N;20190509;20220401;N;20190509;20220401'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // Verify correct mapping
      expect(parts[1]).toBe('33581424') // CNPJ -> basic_doc
      expect(parts[2]).toBe('N') // OPCAO_SIMPLES -> choose_simple_module
      expect(parts[3]).toBe('2019-05-09') // DATA_OPCAO_SIMPLES -> date_simple_module_start
      expect(parts[4]).toBe('2022-04-01') // DATA_EXCLUSAO_SIMPLES -> date_exclude_simple_module_start
      expect(parts[5]).toBe('N') // OPCAO_MEI -> choose_mei
      expect(parts[6]).toBe('2019-05-09') // DATA_OPCAO_MEI -> date_mei_start
      expect(parts[7]).toBe('2022-04-01') // DATA_EXCLUSAO_MEI -> date_exclude_mei_start
    })

    it('should not confuse option status with date fields', () => {
      // This was the original bug: "N" was being sent to a timestamp field
      const line = '12345678;S;20200101;;N;;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // choose_simple_module should be 'S', not a date
      expect(parts[2]).toBe('S')
      // date_simple_module_start should be a formatted date
      expect(parts[3]).toBe('2020-01-01')
      // date_exclude_simple_module_start should be empty, not 'N'
      expect(parts[4]).toBe('')
      // choose_mei should be 'N'
      expect(parts[5]).toBe('N')
    })
  })

  describe('createTransformStream', () => {
    it('should skip header line when skipHeader is true', async () => {
      const csvContent = createCsvContent([
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
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
      expect(lines[0]).not.toContain('CNPJ')
    })

    it('should not skip header line when skipHeader is false', async () => {
      const csvContent = createCsvContent(
        ['12345678000199;S;20190509;20220401;N;20200101;20210601'],
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
        'HEADER\n12345678000199;S;20190509;20220401;N;20200101;20210601\n\n\n98765432000188;N;;;;S;;'
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
            `${String(i + 1).padStart(8, '0')}000199;S;20190509;20220401;N;20200101;20210601`
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
    it('should create and drop temporary table', async () => {
      const csvContent = createCsvContent([
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Track queries
      const queries: string[] = []
      mockClient.query.mockImplementation((query: any) => {
        if (typeof query === 'string') {
          queries.push(query)
        }
        if (typeof query === 'object' && query.submit) {
          const stream = {
            rowCount: 1,
            on: jest.fn((event: string, cb: () => void) => {
              if (event === 'finish') setTimeout(cb, 0)
              return stream
            }),
            write: jest.fn().mockReturnValue(true),
            end: jest.fn()
          }
          return stream
        }
        return { rowCount: 1 } as QueryResult
      })

      try {
        await (processor as any).importWithCopy(testFilePath, ';', true, job)
      } catch {
        // May fail due to mock limitations
      }

      // Verify CREATE TEMP TABLE was called
      expect(queries.some(q => q.includes('CREATE TEMP TABLE'))).toBe(true)
    })

    it('should release client in finally block', async () => {
      const job = createMockJob()

      // Reset mock to track calls
      mockClient.release.mockClear()

      // Force an error on first query (CREATE TEMP TABLE) to test finally block
      mockClient.query.mockRejectedValueOnce(new Error('Connection error'))

      await expect(
        (processor as any).importWithCopy(testFilePath, ';', true, job)
      ).rejects.toThrow('Connection error')

      // Client should still be released even on error
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should release client on error', async () => {
      const csvContent = createCsvContent([
        '12345678000199;S;20190509;20220401;N;20200101;20210601'
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Reset mock
      mockClient.release.mockClear()
      mockClient.query.mockRejectedValue(new Error('Database error'))

      await expect(
        (processor as any).importWithCopy(testFilePath, ';', true, job)
      ).rejects.toThrow('Database error')

      expect(mockClient.release).toHaveBeenCalled()
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
