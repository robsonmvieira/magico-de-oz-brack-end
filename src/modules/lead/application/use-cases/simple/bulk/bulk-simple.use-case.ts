import { Inject, Injectable, HttpStatus } from '@nestjs/common'
import { ILeadRepository } from '@modules/lead/domain/repositories'
import { SimpleEntity } from '@modules/lead/domain/entities/contracts/simple.entity'
import { SimpleMapper } from '@modules/lead/application/mappers/simple.mapper'
import { ModelOutput } from '@modules/core/application/use-cases/common'
import { BulkSimpleInput, BulkSimpleOutput } from './dtos'

type SimpleOptionStatus = 'N' | 'S' | 'O'

@Injectable()
export class BulkSimpleUseCase {
  @Inject('ILeadRepository')
  private readonly repo: ILeadRepository

  async execute(
    input: BulkSimpleInput
  ): Promise<ModelOutput<BulkSimpleOutput>> {
    try {
      if (!input.items || input.items.length === 0) {
        return new ModelOutput<BulkSimpleOutput>({
          data: null,
          hasError: true,
          error: { items: ['At least one item is required'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const entities = input.items.map(item =>
        SimpleEntity.create({
          basicDoc: item.basicDoc,
          chooseSimpleModule:
            (item.chooseSimpleModule as SimpleOptionStatus) ?? 'O',
          dateSimpleModuleStart: item.dateSimpleModuleStart,
          dateExcludeSimpleModuleStart: item.dateExcludeSimpleModuleStart,
          chooseMEI: (item.chooseMEI as SimpleOptionStatus) ?? 'O',
          dateMEIStart: item.dateMEIStart,
          dateExcludeMEIStart: item.dateExcludeMEIStart
        })
      )

      const hasErrors = entities.some(e => e.notification?.hasError())
      if (hasErrors) {
        return new ModelOutput<BulkSimpleOutput>({
          data: null,
          hasError: true,
          error: { validation: ['One or more items have validation errors'] },
          statusCode: HttpStatus.BAD_REQUEST
        })
      }

      const models = entities.map(e => SimpleMapper.toModel(e) as any)
      const saved = await this.repo.bulkSimple(models)

      return new ModelOutput<BulkSimpleOutput>({
        data: {
          imported: saved.length,
          items: saved.map(s => SimpleMapper.toOutput(s))
        },
        hasError: false,
        error: null,
        statusCode: HttpStatus.CREATED
      })
    } catch (error) {
      return new ModelOutput<BulkSimpleOutput>({
        data: null,
        hasError: true,
        error: { message: [error.message || 'Internal server error'] },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      })
    }
  }
}
