import { Test, TestingModule } from '@nestjs/testing'
import { EstablishmentImportProcessor } from '@modules/lead/infra/queues/establishment-import.processor'
import { DatabaseModule, PG_POOL } from '@modules/database'
import { EnvModule } from '@modules/env'
import { Pool } from 'pg'
import { Job } from 'bull'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

describe('EstablishmentImportProcessor (Integration)', () => {
  let processor: EstablishmentImportProcessor
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
        await client.query('DELETE FROM establishments WHERE basic_cnpj = $1', [
          value
        ])
      }
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    tempDir = join(
      tmpdir(),
      `establishment-import-integration-test-${randomUUID()}`
    )
    await mkdir(tempDir, { recursive: true })

    module = await Test.createTestingModule({
      imports: [EnvModule, DatabaseModule],
      providers: [EstablishmentImportProcessor]
    }).compile()

    processor = module.get<EstablishmentImportProcessor>(
      EstablishmentImportProcessor
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
    it('should import data from CSV file to database', async () => {
      const uniqueBasicCnpj1 = `T${Date.now().toString().slice(-7)}`
      const uniqueBasicCnpj2 = `U${Date.now().toString().slice(-7)}`

      const csvContent = createCsvContent([
        `"${uniqueBasicCnpj1}";"0001";"39";"1";"TEST COMPANY ONE";"02";"20190116";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""`,
        `"${uniqueBasicCnpj2}";"0001";"40";"2";"TEST COMPANY TWO";"02";"20200101";"";"";"";"";"7711000";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"""`
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
            'SELECT * FROM establishments WHERE basic_cnpj IN ($1, $2)',
            [uniqueBasicCnpj1, uniqueBasicCnpj2]
          )
          expect(queryResult.rows.length).toBe(2)
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestData([uniqueBasicCnpj1, uniqueBasicCnpj2])
      }
    })

    it('should correctly import establishment with all fields', async () => {
      const uniqueBasicCnpj = `X${Date.now().toString().slice(-7)}`

      // Full record similar to the PDF example
      const csvContent = createCsvContent([
        `"${uniqueBasicCnpj}";"0001";"39";"1";"QUATTRO RENT A CAR";"02";"20190116";"63";"";"105";"19930928";"7711000";"7739099,4923002";"RUA";"JUNIOR ROCHA";"1075";"SALA 1";"PARQUE MANIBURA";"60821585";"CE";"1389";"85";"88061568";"85";"88061569";"85";"88061570";"test@test.com";"";"""`
      ])
      await writeFile(testFilePath, csvContent, 'utf-8')

      const job = createMockJob()

      try {
        const result = await processor.handleImport(job)

        expect(result.totalImported).toBe(1)

        const client = await pool.connect()
        try {
          const queryResult = await client.query(
            'SELECT * FROM establishments WHERE basic_cnpj = $1',
            [uniqueBasicCnpj]
          )
          expect(queryResult.rows.length).toBe(1)

          const row = queryResult.rows[0]
          expect(row.basic_cnpj).toBe(uniqueBasicCnpj)
          expect(row.cnpj_order).toBe('0001')
          expect(row.cnpj_dv).toBe('39')
          expect(row.branch_type).toBe('1')
          expect(row.trade_name).toBe('QUATTRO RENT A CAR')
          expect(row.registration_status).toBe('02')
          expect(row.main_cnae).toBe('7711000')
          expect(row.secondary_cnaes).toBe('7739099,4923002')
          expect(row.street_type).toBe('RUA')
          expect(row.street).toBe('JUNIOR ROCHA')
          expect(row.number).toBe('1075')
          expect(row.complement).toBe('SALA 1')
          expect(row.neighborhood).toBe('PARQUE MANIBURA')
          expect(row.zip_code).toBe('60821585')
          expect(row.state).toBe('CE')
          expect(row.city_code).toBe('1389')
          expect(row.ddd1).toBe('85')
          expect(row.phone1).toBe('88061568')
          expect(row.email).toBe('test@test.com')
        } finally {
          client.release()
        }
      } finally {
        await cleanupTestData([uniqueBasicCnpj])
      }
    })
  })
})
