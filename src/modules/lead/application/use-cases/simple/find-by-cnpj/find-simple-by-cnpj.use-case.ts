import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { SimpleMapper } from '@modules/lead/application/mappers/simple.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindSimpleByCnpjOutput } from './dtos'

@Injectable()
export class FindSimpleByCnpjUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(cnpj: string): Promise<ModelOutput<FindSimpleByCnpjOutput>> {
    try {
      if (!cnpj) {
        return new ModelOutput<FindSimpleByCnpjOutput>({
          data: null,
          hasError: true,
          error: { cnpj: ['CNPJ is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findSimpleByBasicDoc(cnpj)

      if (!model) {
        return new ModelOutput<FindSimpleByCnpjOutput>({
          data: null,
          hasError: true,
          error: { cnpj: ['Simple record not found for this CNPJ'] },
          statusCode: HttpStatus.NOT_FOUND
        })
      }

      return new ModelOutput<FindSimpleByCnpjOutput>({
        data: SimpleMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindSimpleByCnpjOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
