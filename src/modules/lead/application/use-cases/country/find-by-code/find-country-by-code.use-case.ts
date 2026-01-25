import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { CountryMapper } from '@modules/lead/application/mappers/country.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindCountryByCodeOutput } from './dtos'

@Injectable()
export class FindCountryByCodeUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(code: string): Promise<ModelOutput<FindCountryByCodeOutput>> {
    try {
      if (!code) {
        return new ModelOutput<FindCountryByCodeOutput>({
          data: null,
          hasError: true,
          error: { code: ['Code is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findCountryByCode(code)

      if (!model) {
        return new ModelOutput<FindCountryByCodeOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindCountryByCodeOutput>({
        data: CountryMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindCountryByCodeOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
