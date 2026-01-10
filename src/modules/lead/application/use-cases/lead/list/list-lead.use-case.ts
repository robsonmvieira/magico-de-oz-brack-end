import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LeadOutput } from './dtos'
import { LeadMapper } from '@modules/lead/application/mappers/lead.mapper'
import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ModelCollectionOutput } from '@modules/core/application/use-cases/common'

@Injectable()
export class ListLeadUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(): Promise<ModelCollectionOutput<LeadOutput>> {
    try {
      const items = await this.repo.findAll()
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
