import { eq } from 'drizzle-orm'
import { DrizzleRepository } from '@modules/shared/infra/repositories'
import { DrizzleDB } from '@modules/database'
import { PgTable } from 'drizzle-orm/pg-core'

type TestTable = PgTable & { id: any; isDeleted: any }

class TestRepository extends DrizzleRepository<TestTable> {
  constructor(db: DrizzleDB, table: TestTable) {
    super(db, table)
  }

  public exposeGetDb(tx?: DrizzleDB): DrizzleDB {
    return this.getDb(tx)
  }
}

describe('DrizzleRepository', () => {
  let repository: TestRepository
  let mockDb: jest.Mocked<DrizzleDB>
  let mockTable: TestTable

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      limit: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<DrizzleDB>

    mockTable = {
      id: 'id',
      isDeleted: 'isDeleted'
    } as unknown as TestTable

    repository = new TestRepository(mockDb, mockTable)
  })

  describe('getDb', () => {
    it('should return default db when no transaction provided', () => {
      const result = repository.exposeGetDb()

      expect(result).toBe(mockDb)
    })

    it('should return transaction when provided', () => {
      const mockTx = { isTx: true } as unknown as DrizzleDB

      const result = repository.exposeGetDb(mockTx)

      expect(result).toBe(mockTx)
    })
  })

  describe('save', () => {
    it('should use default db when no transaction provided', async () => {
      const entity = { id: '123', name: 'Test' }

      await repository.save(entity as any)

      expect(mockDb.insert).toHaveBeenCalledWith(mockTable)
    })

    it('should use transaction when provided', async () => {
      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined)
        })
      } as unknown as DrizzleDB

      const entity = { id: '123', name: 'Test' }

      await repository.save(entity as any, mockTx)

      expect(mockTx.insert).toHaveBeenCalledWith(mockTable)
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should use default db when no transaction provided', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      }
      mockDb.update = jest.fn().mockReturnValue(mockUpdate)

      await repository.update('123', { name: 'Updated' } as any)

      expect(mockDb.update).toHaveBeenCalledWith(mockTable)
    })

    it('should use transaction when provided', async () => {
      const mockTx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined)
          })
        })
      } as unknown as DrizzleDB

      await repository.update('123', { name: 'Updated' } as any, mockTx)

      expect(mockTx.update).toHaveBeenCalledWith(mockTable)
      expect(mockDb.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should use default db when no transaction provided', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      }
      mockDb.update = jest.fn().mockReturnValue(mockUpdate)

      const entity = { id: '123' }

      await repository.delete(entity as any)

      expect(mockDb.update).toHaveBeenCalledWith(mockTable)
    })

    it('should use transaction when provided', async () => {
      const mockTx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined)
          })
        })
      } as unknown as DrizzleDB

      const entity = { id: '123' }

      await repository.delete(entity as any, mockTx)

      expect(mockTx.update).toHaveBeenCalledWith(mockTable)
    })
  })

  describe('findById', () => {
    it('should use default db when no transaction provided', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      }
      mockDb.select = jest.fn().mockReturnValue(mockSelect)

      await repository.findById('123')

      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should use transaction when provided', async () => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: '123', name: 'Found' }])
            })
          })
        })
      } as unknown as DrizzleDB

      const result = await repository.findById('123', mockTx)

      expect(mockTx.select).toHaveBeenCalled()
      expect(result).toEqual({ id: '123', name: 'Found' })
    })

    it('should return null when entity not found', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      }
      mockDb.select = jest.fn().mockReturnValue(mockSelect)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should use default db when no transaction provided', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      }
      mockDb.select = jest.fn().mockReturnValue(mockSelect)

      await repository.findAll()

      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should use transaction when provided', async () => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { id: '1', name: 'Item 1' },
              { id: '2', name: 'Item 2' }
            ])
          })
        })
      } as unknown as DrizzleDB

      const result = await repository.findAll(mockTx)

      expect(mockTx.select).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })
  })
})
