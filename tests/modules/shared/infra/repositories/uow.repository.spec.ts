import { UnitOfWorkDrizzleRepository } from '@modules/shared/infra/repositories'
import { DrizzleDB } from '@modules/database'
import { AggregateRoot } from '@modules/core/domain/entities'

class TestAggregate extends AggregateRoot {
  constructor(id: string) {
    super()
    this.id = id
  }
}

describe('UnitOfWorkDrizzleRepository', () => {
  let uow: UnitOfWorkDrizzleRepository
  let mockDb: jest.Mocked<DrizzleDB>

  beforeEach(() => {
    mockDb = {
      transaction: jest.fn()
    } as unknown as jest.Mocked<DrizzleDB>

    uow = new UnitOfWorkDrizzleRepository(mockDb)
  })

  describe('do', () => {
    it('should execute callback within a transaction', async () => {
      const expectedResult = { id: '123', name: 'Test' }
      const callback = jest.fn().mockResolvedValue(expectedResult)

      mockDb.transaction.mockImplementation(async fn => {
        const mockTx = {} as DrizzleDB
        return fn(mockTx)
      })

      const result = await uow.do(callback)

      expect(result).toEqual(expectedResult)
      expect(mockDb.transaction).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should pass transaction to callback', async () => {
      const mockTx = { isTx: true } as unknown as DrizzleDB

      mockDb.transaction.mockImplementation(async fn => {
        return fn(mockTx)
      })

      await uow.do(async tx => {
        expect(tx).toBe(mockTx)
      })
    })

    it('should rollback on error and propagate exception', async () => {
      const error = new Error('Database error')

      mockDb.transaction.mockImplementation(async fn => {
        const mockTx = {} as DrizzleDB
        return fn(mockTx)
      })

      await expect(
        uow.do(async () => {
          throw error
        })
      ).rejects.toThrow('Database error')
    })

    it('should clear aggregates after successful transaction', async () => {
      const aggregate = new TestAggregate('123')

      mockDb.transaction.mockImplementation(async fn => {
        const mockTx = {} as DrizzleDB
        return fn(mockTx)
      })

      uow.addAggregate(aggregate)
      expect(uow.getAggregates()).toHaveLength(1)

      await uow.do(async () => {
        return 'success'
      })

      expect(uow.getAggregates()).toHaveLength(0)
    })

    it('should call clearEvents on aggregates after commit', async () => {
      const aggregate = new TestAggregate('123')
      const clearEventsSpy = jest.spyOn(aggregate, 'clearEvents')

      mockDb.transaction.mockImplementation(async fn => {
        const mockTx = {} as DrizzleDB
        return fn(mockTx)
      })

      uow.addAggregate(aggregate)

      await uow.do(async () => {
        return 'success'
      })

      expect(clearEventsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('addAggregate', () => {
    it('should add aggregate to the set', () => {
      const aggregate = new TestAggregate('123')

      uow.addAggregate(aggregate)

      expect(uow.getAggregates()).toContain(aggregate)
    })

    it('should not add duplicate aggregates', () => {
      const aggregate = new TestAggregate('123')

      uow.addAggregate(aggregate)
      uow.addAggregate(aggregate)

      expect(uow.getAggregates()).toHaveLength(1)
    })

    it('should add multiple different aggregates', () => {
      const aggregate1 = new TestAggregate('123')
      const aggregate2 = new TestAggregate('456')

      uow.addAggregate(aggregate1)
      uow.addAggregate(aggregate2)

      expect(uow.getAggregates()).toHaveLength(2)
      expect(uow.getAggregates()).toContain(aggregate1)
      expect(uow.getAggregates()).toContain(aggregate2)
    })
  })

  describe('getAggregates', () => {
    it('should return empty array when no aggregates added', () => {
      expect(uow.getAggregates()).toEqual([])
    })

    it('should return array of added aggregates', () => {
      const aggregate1 = new TestAggregate('123')
      const aggregate2 = new TestAggregate('456')

      uow.addAggregate(aggregate1)
      uow.addAggregate(aggregate2)

      const aggregates = uow.getAggregates()

      expect(aggregates).toHaveLength(2)
      expect(aggregates).toContain(aggregate1)
      expect(aggregates).toContain(aggregate2)
    })
  })
})
