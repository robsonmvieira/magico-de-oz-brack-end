import { Test, TestingModule } from '@nestjs/testing'
import { CountryImportProcessor } from '@modules/lead/infra/queues/country-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('CountryImportProcessor (Integration)', () => {
  let processor: CountryImportProcessor
  let module: TestingModule
  let pool: Pool
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

  const createCsvContent = (lines: string[]): string => {
    return lines.join('\n')
  }

  const cleanupTestCountries = async (codes: string[]) => {
    const client = await pool.connect()
    try {
      for (const code of codes) {
        await client.query('DELETE FROM countries WHERE code = $1', [code])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `country-import-integration-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [CountryImportProcessor]
    }).compile()

    processor = module.get<CountryImportProcessor>(CountryImportProcessor)
    pool = module.get<Pool>(PG_POOL)
  })

  beforeEach(async () => {
    testFilePath = join(tempDir, `test-${randomUUID()}.csv`)
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist or already deleted
    }
  })

  afterAll(async () => {
    await module.close()
  })

  describe('handleImport with real database', () => {
    it('should import countries from CSV file to database', async () => {
      const uniqueCode1 = `T${Date.now().toString().slice(-5)}1`
      const uniqueCode2 = `T${Date.now().toString().slice(-5)}2`

      const csvContent = createCsvContent([
        `"${uniqueCode1}";"TEST COUNTRY ONE"`,
        `"${uniqueCode2}";"TEST COUNTRY TWO"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(2)
        expect(result.totalErrors).toBe(0)
        expect(result.durationMs).toBeGreaterThanOrEqual(0)

        // Verify countries were inserted into database
        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM countries WHERE code IN ($1, $2)',
            [uniqueCode1, uniqueCode2]
          )
          expect(queryResult.rows.length).toBe(2)

          const country1 = queryResult.rows.find(r => r.code === uniqueCode1)
          const country2 = queryResult.rows.find(r => r.code === uniqueCode2)

          expect(country1).toBeDefined()
          expect(country1.name).toBe('TEST COUNTRY ONE')
          expect(country2).toBeDefined()
          expect(country2.name).toBe('TEST COUNTRY TWO')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestCountries([uniqueCode1, uniqueCode2])
      }
    })

    it('should skip empty lines during import', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-6)}`

      const csvContent = createCsvContent([
        `"${uniqueCode}";"TEST COUNTRY"`,
        '',
        '',
        ''
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(1)
      } finally {
        await cleanupTestCountries([uniqueCode])
      }
    })

    it('should handle CSV with header when skipHeader is true', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-6)}`

      const csvContent = createCsvContent([
        '"CODE";"NAME"',
        `"${uniqueCode}";"TEST COUNTRY"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(1)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM countries WHERE code = $1',
            [uniqueCode]
          )
          expect(queryResult.rows.length).toBe(1)
          expect(queryResult.rows[0].name).toBe('TEST COUNTRY')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestCountries([uniqueCode])
      }
    })
  })
})
