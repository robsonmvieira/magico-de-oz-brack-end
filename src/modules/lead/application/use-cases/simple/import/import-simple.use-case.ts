import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { SimpleEntity } from '@modules/lead/domain/entities/simple.entity'
import { SimpleMapper } from '@modules/lead/application/mappers/simple.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { ImportSimpleInput, ImportSimpleOutput } from './dtos'

type SimpleOptionStatus = 'N' | 'S' | 'O'

@Injectable()
export class ImportSimpleUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    input: ImportSimpleInput
  ): Promise<ModelOutput<ImportSimpleOutput>> {
    try {
      if (!input.basicDoc) {
        return new ModelOutput<ImportSimpleOutput>({
          data: null,
          hasError: true,
          error: { basicDoc: ['basicDoc is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const entity = SimpleEntity.create({
        basicDoc: input.basicDoc,
        chooseSimpleModule:
          (input.chooseSimpleModule as SimpleOptionStatus) ?? 'O',
        dateSimpleModuleStart: input.dateSimpleModuleStart,
        dateExcludeSimpleModuleStart: input.dateExcludeSimpleModuleStart,
        chooseMEI: (input.chooseMEI as SimpleOptionStatus) ?? 'O',
        dateMEIStart: input.dateMEIStart,
        dateExcludeMEIStart: input.dateExcludeMEIStart
      })

      if (entity.notification?.hasError()) {
        return new ModelOutput<ImportSimpleOutput>({
          data: null,
          hasError: true,
          error: entity.notification.errors,
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const model = SimpleMapper.toModel(entity)
      const saved = await this.repo.createSimple(model as any)

      return new ModelOutput<ImportSimpleOutput>({
        data: SimpleMapper.toOutput(saved),
        hasError: false,
        error: null,
        statusCode: HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput<ImportSimpleOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
