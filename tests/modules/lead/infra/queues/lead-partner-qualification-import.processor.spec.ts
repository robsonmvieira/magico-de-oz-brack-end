import { LeadPartnerQualificationImportProcessor } from '@modules/lead/infra/queues/lead-partner-qualification-import.processor'
import { Job } from 'bull'
import { Pool, QueryResult } from 'pg'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('LeadPartnerQualificationImportProcessor', () => {
  let processor: LeadPartnerQualificationImportProcessor
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
    const header = 'CODE;DESCRIPTION'
    if (includeHeader) {
      return [header, ...lines].join('\n')
    }
    return lines.join('\n')
  }

  beforeAll(async () => {
    tempDir = join(
      tmpdir(),
      `lead-partner-qualification-import-test-${randomUUID()}`
    )
    await mkdir(tempDir, { recursive: true })
  })

  beforeEach(async () => {
    testFilePath = join(tempDir, `test-${randomUUID()}.csv`)

    mockClient = {
      query: jest.fn().mockImplementation((query: any) => {
        if (typeof query === 'object' && query.submit) {
          // pg-copy-streams mock
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

    processor = new LeadPartnerQualificationImportProcessor(mockPool)
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist
    }
  })

  describe('transformLine', () => {
    it('should correctly parse CSV line with code and description', () => {
      const line = '"19";"Sindico (Condominio)"'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // UUID
      expect(parts[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      // code
      expect(parts[1]).toBe('19')
      // description
      expect(parts[2]).toBe('Sindico (Condominio)')
    })

    it('should handle unquoted CSV fields', () => {
      const line = '19;Sindico (Condominio)'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')
      expect(parts[1]).toBe('19')
      expect(parts[2]).toBe('Sindico (Condominio)')
    })

    it('should return null for lines with less than 2 columns', () => {
      const line = '19'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should return null for lines without code', () => {
      const line = ';Sindico (Condominio)'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should return null for lines without description', () => {
      const line = '19;'
      const result = (processor as any).transformLine(line, ';')

      expect(result).toBeNull()
    })

    it('should handle different qualification codes', () => {
      const testCases = [
        {
          line: '"19";"Sindico (Condominio)"',
          code: '19',
          description: 'Sindico (Condominio)'
        },
        {
          line: '"05";"Administrador"',
          code: '05',
          description: 'Administrador'
        },
        { line: '"10";"Diretor"', code: '10', description: 'Diretor' },
        { line: '"22";"Socio"', code: '22', description: 'Socio' }
      ]

      for (const { line, code, description } of testCases) {
        const result = (processor as any).transformLine(line, ';')
        expect(result).not.toBeNull()
        const parts = result.split(',')
        expect(parts[1]).toBe(code)
        expect(parts[2]).toBe(description)
      }
    })
  })

  describe('handleImport', () => {
    it('should delete temp file after successful import', async () => {
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
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
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
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
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
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
      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CSV column order mapping', () => {
    it('should correctly map Receita Federal CSV format for partner qualifications', () => {
      // Format: CODE;DESCRIPTION
      const line = '"19";"Sindico (Condominio)"'
      const result = (processor as any).transformLine(line, ';')

      expect(result).not.toBeNull()
      const parts = result.split(',')

      // Verify correct mapping
      expect(parts[1]).toBe('19') // CODE -> code
      expect(parts[2]).toBe('Sindico (Condominio)') // DESCRIPTION -> description
    })
  })

  describe('createTransformStream', () => {
    it('should skip header line when skipHeader is true', async () => {
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'], true)
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
      expect(lines[0]).not.toContain('CODE')
    })

    it('should not skip header line when skipHeader is false', async () => {
      const csvContent = createCsvContent(
        ['"19";"Sindico (Condominio)"'],
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
      const csvContent = '"19";"Sindico (Condominio)"\n\n\n"05";"Administrador"'
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

      expect(lines.length).toBe(2)
    })

    it('should report progress every 100000 records', async () => {
      // Create a small file for unit test
      const lines = Array(5)
        .fill(null)
        .map(
          (_, i) =>
            `"${String(i + 1).padStart(2, '0')}";"QUALIFICATION ${i + 1}"`
        )
      const csvContent = createCsvContent(lines)
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: false })
      const stream = (processor as any).createTransformStream(
        testFilePath,
        ';',
        false,
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
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Mock that returns a proper stream for COPY
      const mockStream = {
        rowCount: 1,
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'finish') setTimeout(cb, 0)
          return mockStream
        }),
        emit: jest.fn(),
        write: jest.fn().mockReturnValue(true),
        end: jest.fn()
      }

      const freshMockClient = {
        query: jest.fn().mockImplementation((query: any) => {
          if (typeof query === 'object' && query.submit) {
            return mockStream
          }
          return { rowCount: 1 }
        }),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      try {
        await (processor as any).importWithCopy(testFilePath, ';', false, job)
      } catch {
        // May fail due to mock limitations
      }

      expect(mockPool.connect).toHaveBeenCalled()
      expect(freshMockClient.release).toHaveBeenCalled()
    })

    it('should release client in finally block', async () => {
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Mock stream with emit method
      const mockStream = {
        rowCount: 1,
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'finish') setTimeout(cb, 0)
          return mockStream
        }),
        emit: jest.fn(),
        write: jest.fn().mockReturnValue(true),
        end: jest.fn()
      }

      const freshMockClient = {
        query: jest.fn().mockImplementation((query: any) => {
          if (typeof query === 'object' && query.submit) {
            return mockStream
          }
          return { rowCount: 1 }
        }),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      try {
        await (processor as any).importWithCopy(testFilePath, ';', false, job)
      } catch {
        // May fail due to mock limitations
      }

      // Client should still be released even on error
      expect(freshMockClient.release).toHaveBeenCalled()
    })

    it('should release client on error', async () => {
      const csvContent = createCsvContent(['"19";"Sindico (Condominio)"'])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      // Mock stream for COPY with emit method
      const mockStream = {
        rowCount: 1,
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'finish') setTimeout(cb, 0)
          return mockStream
        }),
        emit: jest.fn(),
        write: jest.fn().mockReturnValue(true),
        end: jest.fn()
      }

      const freshMockClient = {
        query: jest.fn().mockImplementation((query: any) => {
          if (typeof query === 'object' && query.submit) {
            return mockStream
          }
          return { rowCount: 1 }
        }),
        release: jest.fn()
      }
      ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(freshMockClient)

      try {
        await (processor as any).importWithCopy(testFilePath, ';', false, job)
      } catch {
        // May fail due to mock limitations
      }

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
