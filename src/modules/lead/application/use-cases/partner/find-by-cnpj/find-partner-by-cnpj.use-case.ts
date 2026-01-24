import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { PartnerMapper } from '@modules/lead/application/mappers/partner.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindPartnerByCnpjOutput } from './dtos'

@Injectable()
export class FindPartnerByCnpjUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(cnpj: string): Promise<ModelOutput<FindPartnerByCnpjOutput>> {
    try {
      if (!cnpj) {
        return new ModelOutput<FindPartnerByCnpjOutput>({
          data: null,
          hasError: true,
          error: { cnpj: ['CNPJ is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const models = await this.repo.findPartnersByBasicCnpj(cnpj)

      if (!models || models.length === 0) {
        return new ModelOutput<FindPartnerByCnpjOutput>({
          data: [],
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindPartnerByCnpjOutput>({
        data: models.map(model => PartnerMapper.toOutput(model)),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindPartnerByCnpjOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
