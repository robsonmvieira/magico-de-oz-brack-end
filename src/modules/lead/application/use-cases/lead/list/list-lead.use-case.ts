import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadOutput } from './dtos'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import {
  PaginatedOutput,
  ModelCollectionOutput
} from '@modules/core/application/use-cases/common'
import {
  ICacheRepository,
  PaginationParams
} from '@modules/core/domain/repositories'

export interface ListLeadInput extends PaginationParams {}

@Injectable()
export class ListLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ICacheRepository')
  private readonly cacheRepo: ICacheRepository

  async execute(
    input: ListLeadInput = {}
  ): Promise<PaginatedOutput<LeadOutput>> {
    try {
      const { page = 1, limit = 10, sortBy, sortOrder, search } = input

      // Build cache key based on pagination params
      const cacheKey = `leads:page=${page}:limit=${limit}:sortBy=${sortBy || 'createdAt'}:sortOrder=${sortOrder || 'desc'}:search=${search || ''}`
      const cacheTtl = 30 // 30 seconds

      const cachedData = await this.cacheRepo.get(cacheKey)
      if (cachedData) {
        const cached = JSON.parse(cachedData)
        return new PaginatedOutput<LeadOutput>({
          data: cached.data,
          totalItems: cached.totalItems,
          page: cached.page,
          limit: cached.limit,
          hasError: false,
          statusCode: HttpStatus.OK
        })
      }

      const result = await this.repo.findAllPaginated({
        page,
        limit,
        sortBy,
        sortOrder,
        search
      })

      const output = result.data.map(LeadMapper.toOutput)

      const paginatedResult = {
        data: output,
        totalItems: result.totalItems,
        page: result.page,
        limit: result.limit
      }

      await this.cacheRepo.set(
        cacheKey,
        JSON.stringify(paginatedResult),
        cacheTtl
      )

      return new PaginatedOutput<LeadOutput>({
        data: output,
        totalItems: result.totalItems,
        page: result.page,
        limit: result.limit,
        hasError: false,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return PaginatedOutput.error<LeadOutput>(
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Keep backward compatibility for existing code that uses findAll without pagination
  async executeAll(): Promise<ModelCollectionOutput<LeadOutput>> {
    try {
      const cacheKey = 'leads:all'
      const cacheTtl = 30

      const cachedData = await this.cacheRepo.get(cacheKey)
      if (cachedData) {
        return new ModelCollectionOutput<LeadOutput>({
          data: JSON.parse(cachedData),
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      const items = await this.repo.findAll()
      const output = items.map(LeadMapper.toOutput)

      await this.cacheRepo.set(cacheKey, JSON.stringify(output), cacheTtl)

      return new ModelCollectionOutput<LeadOutput>({
        data: output,
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelCollectionOutput<LeadOutput>({
        data: [],
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
