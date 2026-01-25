import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { EstablishmentMapper } from '@modules/lead/application/mappers/establishment.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindEstablishmentByFullCnpjOutput } from './dtos'

@Injectable()
export class FindEstablishmentByFullCnpjUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    basicCnpj: string,
    cnpjOrder: string,
    cnpjDv: string
  ): Promise<ModelOutput<FindEstablishmentByFullCnpjOutput>> {
    try {
      if (!basicCnpj || !cnpjOrder || !cnpjDv) {
        return new ModelOutput<FindEstablishmentByFullCnpjOutput>({
          data: null,
          hasError: true,
          error: {
            cnpj: ['Basic CNPJ, CNPJ Order, and CNPJ DV are required']
          },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findEstablishmentByFullCnpj(
        basicCnpj,
        cnpjOrder,
        cnpjDv
      )

      if (!model) {
        return new ModelOutput<FindEstablishmentByFullCnpjOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindEstablishmentByFullCnpjOutput>({
        data: EstablishmentMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindEstablishmentByFullCnpjOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
