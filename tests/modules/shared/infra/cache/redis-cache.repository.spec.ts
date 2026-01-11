import { RedisCacheRepository } from '@modules/shared/infra/cache'
import { Redis } from 'ioredis'

describe('RedisCacheRepository', () => {
  let repository: RedisCacheRepository
  let mockRedis: jest.Mocked<Redis>

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    } as unknown as jest.Mocked<Redis>

    repository = new RedisCacheRepository(mockRedis)
  })

  describe('get', () => {
    it('should return value when key exists', async () => {
      const key = 'test-key'
      const value = JSON.stringify({ data: 'test' })
      mockRedis.get.mockResolvedValue(value)

      const result = await repository.get(key)

      expect(result).toBe(value)
      expect(mockRedis.get).toHaveBeenCalledWith(key)
      expect(mockRedis.get).toHaveBeenCalledTimes(1)
    })

    it('should return null when key does not exist', async () => {
      const key = 'nonexistent-key'
      mockRedis.get.mockResolvedValue(null)

      const result = await repository.get(key)

      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith(key)
    })

    it('should handle Redis errors', async () => {
      const key = 'error-key'
      mockRedis.get.mockRejectedValue(new Error('Redis connection error'))

      await expect(repository.get(key)).rejects.toThrow(
        'Redis connection error'
      )
    })
  })

  describe('set', () => {
    it('should set value with TTL', async () => {
      const key = 'test-key'
      const value = JSON.stringify({ data: 'test' })
      const ttl = 3600
      mockRedis.set.mockResolvedValue('OK')

      await repository.set(key, value, ttl)

      expect(mockRedis.set).toHaveBeenCalledWith(key, value, 'EX', ttl)
      expect(mockRedis.set).toHaveBeenCalledTimes(1)
    })

    it('should set value with short TTL', async () => {
      const key = 'short-ttl-key'
      const value = 'simple-value'
      const ttl = 60
      mockRedis.set.mockResolvedValue('OK')

      await repository.set(key, value, ttl)

      expect(mockRedis.set).toHaveBeenCalledWith(key, value, 'EX', ttl)
    })

    it('should handle Redis errors on set', async () => {
      const key = 'error-key'
      const value = 'value'
      const ttl = 3600
      mockRedis.set.mockRejectedValue(new Error('Redis write error'))

      await expect(repository.set(key, value, ttl)).rejects.toThrow(
        'Redis write error'
      )
    })
  })

  describe('delete', () => {
    it('should delete key from cache', async () => {
      const key = 'test-key'
      mockRedis.del.mockResolvedValue(1)

      await repository.delete(key)

      expect(mockRedis.del).toHaveBeenCalledWith(key)
      expect(mockRedis.del).toHaveBeenCalledTimes(1)
    })

    it('should not throw when key does not exist', async () => {
      const key = 'nonexistent-key'
      mockRedis.del.mockResolvedValue(0)

      await expect(repository.delete(key)).resolves.not.toThrow()
      expect(mockRedis.del).toHaveBeenCalledWith(key)
    })

    it('should handle Redis errors on delete', async () => {
      const key = 'error-key'
      mockRedis.del.mockRejectedValue(new Error('Redis delete error'))

      await expect(repository.delete(key)).rejects.toThrow('Redis delete error')
    })
  })

  describe('integration scenarios', () => {
    it('should handle cache miss then cache hit pattern', async () => {
      const key = 'user:123'
      const userData = JSON.stringify({ id: '123', name: 'John' })

      mockRedis.get.mockResolvedValueOnce(null)

      const firstResult = await repository.get(key)
      expect(firstResult).toBeNull()

      mockRedis.set.mockResolvedValue('OK')
      await repository.set(key, userData, 3600)

      mockRedis.get.mockResolvedValueOnce(userData)

      const secondResult = await repository.get(key)
      expect(secondResult).toBe(userData)
    })

    it('should handle cache invalidation pattern', async () => {
      const key = 'session:abc'
      const sessionData = JSON.stringify({ userId: '123', token: 'xyz' })

      mockRedis.set.mockResolvedValue('OK')
      await repository.set(key, sessionData, 7200)

      mockRedis.get.mockResolvedValue(sessionData)
      const cached = await repository.get(key)
      expect(cached).toBe(sessionData)

      mockRedis.del.mockResolvedValue(1)
      await repository.delete(key)

      mockRedis.get.mockResolvedValue(null)
      const afterDelete = await repository.get(key)
      expect(afterDelete).toBeNull()
    })
  })
})
