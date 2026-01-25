import { Test, TestingModule } from '@nestjs/testing'
import { LegalNatureImportProcessor } from '@modules/lead/infra/queues/legal-nature-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('LegalNatureImportProcessor (Integration)', () => {
  let processor: LegalNatureImportProcessor
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

  const cleanupTestLegalNatures = async (codes: string[]) => {
    const client = await pool.connect()
    try {
      for (const code of codes) {
        await client.query('DELETE FROM legal_natures WHERE code = $1', [code])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(
      tmpdir(),
      `legal-nature-import-integration-test-${randomUUID()}`
    )
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [LegalNatureImportProcessor]
    }).compile()

    processor = module.get<LegalNatureImportProcessor>(
      LegalNatureImportProcessor
    )
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
    it('should import legal natures from CSV file to database', async () => {
      const uniqueCode1 = `T${Date.now().toString().slice(-5)}1`
      const uniqueCode2 = `T${Date.now().toString().slice(-5)}2`

      const csvContent = createCsvContent([
        `"${uniqueCode1}";"TEST LEGAL NATURE ONE"`,
        `"${uniqueCode2}";"TEST LEGAL NATURE TWO"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(2)
        expect(result.totalErrors).toBe(0)
        expect(result.durationMs).toBeGreaterThanOrEqual(0)

        // Verify legal natures were inserted into database
        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM legal_natures WHERE code IN ($1, $2)',
            [uniqueCode1, uniqueCode2]
          )
          expect(queryResult.rows.length).toBe(2)

          const legalNature1 = queryResult.rows.find(
            r => r.code === uniqueCode1
          )
          const legalNature2 = queryResult.rows.find(
            r => r.code === uniqueCode2
          )

          expect(legalNature1).toBeDefined()
          expect(legalNature1.description).toBe('TEST LEGAL NATURE ONE')
          expect(legalNature2).toBeDefined()
          expect(legalNature2.description).toBe('TEST LEGAL NATURE TWO')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestLegalNatures([uniqueCode1, uniqueCode2])
      }
    })

    it('should skip empty lines during import', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-6)}`

      const csvContent = createCsvContent([
        `"${uniqueCode}";"TEST LEGAL NATURE"`,
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
        await cleanupTestLegalNatures([uniqueCode])
      }
    })

    it('should handle CSV with header when skipHeader is true', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-6)}`

      const csvContent = createCsvContent([
        '"CODE";"DESCRIPTION"',
        `"${uniqueCode}";"TEST LEGAL NATURE"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(1)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM legal_natures WHERE code = $1',
            [uniqueCode]
          )
          expect(queryResult.rows.length).toBe(1)
          expect(queryResult.rows[0].description).toBe('TEST LEGAL NATURE')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestLegalNatures([uniqueCode])
      }
    })
  })
})
