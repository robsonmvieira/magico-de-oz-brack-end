import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { MunicipalityMapper } from '@modules/lead/application/mappers/municipality.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindMunicipalityByCodeOutput } from './dtos'

@Injectable()
export class FindMunicipalityByCodeUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    code: string
  ): Promise<ModelOutput<FindMunicipalityByCodeOutput>> {
    try {
      if (!code) {
        return new ModelOutput<FindMunicipalityByCodeOutput>({
          data: null,
          hasError: true,
          error: { code: ['Code is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findMunicipalityByCode(code)

      if (!model) {
        return new ModelOutput<FindMunicipalityByCodeOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindMunicipalityByCodeOutput>({
        data: MunicipalityMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindMunicipalityByCodeOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
