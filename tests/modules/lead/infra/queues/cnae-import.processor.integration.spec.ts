import { Test, TestingModule } from '@nestjs/testing'
import { CnaeImportProcessor } from '@modules/lead/infra/queues/cnae-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('CnaeImportProcessor (Integration)', () => {
  let processor: CnaeImportProcessor
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

  const cleanupTestCnaes = async (codes: string[]) => {
    const client = await pool.connect()
    try {
      for (const code of codes) {
        await client.query('DELETE FROM cnaes WHERE code = $1', [code])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `cnae-import-integration-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [CnaeImportProcessor]
    }).compile()

    processor = module.get<CnaeImportProcessor>(CnaeImportProcessor)
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
    it('should import CNAEs from CSV file to database', async () => {
      const uniqueCode1 = `T${Date.now().toString().slice(-6)}1`
      const uniqueCode2 = `T${Date.now().toString().slice(-6)}2`

      const csvContent = createCsvContent([
        `"${uniqueCode1}";"TEST CNAE ONE"`,
        `"${uniqueCode2}";"TEST CNAE TWO"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(2)
        expect(result.totalErrors).toBe(0)
        expect(result.durationMs).toBeGreaterThanOrEqual(0)

        // Verify CNAEs were inserted into database
        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM cnaes WHERE code IN ($1, $2)',
            [uniqueCode1, uniqueCode2]
          )
          expect(queryResult.rows.length).toBe(2)

          const cnae1 = queryResult.rows.find(r => r.code === uniqueCode1)
          const cnae2 = queryResult.rows.find(r => r.code === uniqueCode2)

          expect(cnae1).toBeDefined()
          expect(cnae1.description).toBe('TEST CNAE ONE')
          expect(cnae2).toBeDefined()
          expect(cnae2.description).toBe('TEST CNAE TWO')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestCnaes([uniqueCode1, uniqueCode2])
      }
    })

    it('should skip empty lines during import', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-7)}`

      const csvContent = createCsvContent([
        `"${uniqueCode}";"TEST CNAE"`,
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
        await cleanupTestCnaes([uniqueCode])
      }
    })

    it('should handle CSV with header when skipHeader is true', async () => {
      const uniqueCode = `T${Date.now().toString().slice(-7)}`

      const csvContent = createCsvContent([
        '"CODE";"DESCRIPTION"',
        `"${uniqueCode}";"TEST CNAE"`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob({ skipHeader: true })

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(1)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM cnaes WHERE code = $1',
            [uniqueCode]
          )
          expect(queryResult.rows.length).toBe(1)
          expect(queryResult.rows[0].description).toBe('TEST CNAE')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestCnaes([uniqueCode])
      }
    })
  })
})
