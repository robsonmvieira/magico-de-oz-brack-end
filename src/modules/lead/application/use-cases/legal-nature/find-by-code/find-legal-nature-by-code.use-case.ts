import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { LegalNatureMapper } from '@modules/lead/application/mappers/legal-nature.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { FindLegalNatureByCodeOutput } from './dtos'

@Injectable()
export class FindLegalNatureByCodeUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    code: string
  ): Promise<ModelOutput<FindLegalNatureByCodeOutput>> {
    try {
      if (!code) {
        return new ModelOutput<FindLegalNatureByCodeOutput>({
          data: null,
          hasError: true,
          error: { code: ['Code is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = await this.repo.findLegalNatureByCode(code)

      if (!model) {
        return new ModelOutput<FindLegalNatureByCodeOutput>({
          data: null,
          hasError: false,
          error: null,
          statusCode: HttpStatus.OK
        })
      }

      return new ModelOutput<FindLegalNatureByCodeOutput>({
        data: LegalNatureMapper.toOutput(model),
        hasError: false,
        error: null,
        statusCode: HttpStatus.OK
      })
    } catch (error) {
      return new ModelOutput<FindLegalNatureByCodeOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
