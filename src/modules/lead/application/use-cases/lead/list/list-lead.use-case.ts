import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadOutput } from './dtos'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'
import { ICacheRepository } from '@modules/core/domain/repositories'

@Injectable()
export class ListLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  @Inject('ICacheRepository')
  private readonly cacheRepo: ICacheRepository

  async execute(): Promise<ModelCollectionOutput<LeadOutput>> {
    try {
      const cacheKey = 'leads'
      const cacheTtl = 30 // 30 seconds for testing
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
        data: items.map(LeadMapper.toOutput),
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
