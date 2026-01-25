import { Test, TestingModule } from '@nestjs/testing'
import { CompanyImportProcessor } from '@modules/lead/infra/queues/company-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('CompanyImportProcessor (Integration)', () => {
  let processor: CompanyImportProcessor
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

  const cleanupTestData = async (basicCnpjValues: string[]) => {
    const client = await pool.connect()
    try {
      for (const value of basicCnpjValues) {
        await client.query('DELETE FROM companies WHERE basic_cnpj = $1', [
          value
        ])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(tmpdir(), `company-import-integration-test-${randomUUID()}`)
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [CompanyImportProcessor]
    }).compile()

    processor = module.get<CompanyImportProcessor>(CompanyImportProcessor)
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
    it('should import company data from CSV file to database', async () => {
      const uniqueCnpj1 = `T${Date.now().toString().slice(-7)}`
      const uniqueCnpj2 = `T${(Date.now() + 1).toString().slice(-7)}`

      const csvContent = createCsvContent([
        `"${uniqueCnpj1}";"EMPRESA TESTE UM LTDA";"2135";"50";"10000,00";"01";""`,
        `"${uniqueCnpj2}";"EMPRESA TESTE DOIS SA";"2046";"49";"50000,00";"03";""`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(2)
        expect(result.totalErrors).toBe(0)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM companies WHERE basic_cnpj IN ($1, $2)',
            [uniqueCnpj1, uniqueCnpj2]
          )
          expect(queryResult.rows.length).toBe(2)

          const empresa1 = queryResult.rows.find(
            r => r.basic_cnpj === uniqueCnpj1
          )
          expect(empresa1).toBeDefined()
          expect(empresa1.company_name).toBe('EMPRESA TESTE UM LTDA')
          expect(empresa1.legal_nature_code).toBe('2135')
          expect(empresa1.company_size).toBe('01')

          const empresa2 = queryResult.rows.find(
            r => r.basic_cnpj === uniqueCnpj2
          )
          expect(empresa2).toBeDefined()
          expect(empresa2.company_name).toBe('EMPRESA TESTE DOIS SA')
          expect(empresa2.legal_nature_code).toBe('2046')
          expect(empresa2.company_size).toBe('03')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestData([uniqueCnpj1, uniqueCnpj2])
      }
    })
  })
})
