import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { CompanyMapper } from '@modules/lead/application/mappers/company.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindCompanyByBasicCnpjOutput } from './dtos'

@Injectable()
export class FindCompanyByBasicCnpjUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    basicCnpj: string
  ): Promise<ModelOutput<FindCompanyByBasicCnpjOutput>> {
    try {
      if (!basicCnpj) {
        return new ModelOutput<FindCompanyByBasicCnpjOutput>({
          data: null,
          hasError: true,
          error: { basicCnpj: ['Basic CNPJ is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findCompanyByBasicCnpj(basicCnpj)

      if (!model) {
        return new ModelOutput<FindCompanyByBasicCnpjOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindCompanyByBasicCnpjOutput>({
        data: CompanyMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindCompanyByBasicCnpjOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
