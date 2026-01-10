import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID, validateSync } from 'class-validator'

export interface IdParamDtoProps {
  id: string
}

export class IdParamDto {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty({ message: 'ID is required' })
  @IsUUID('4', { message: 'Invalid UUID format' })
  id: string

  constructor(props?: IdParamDtoProps) {
    if (!props) return

    Object.assign(this, props)
  }
}

export class IdParamDtoValidator {
  static validate(props: IdParamDtoProps) {
    const dto = new IdParamDto(props)
    const errors = validateSync(dto)

    const convertErrorsToObject = (
      validationErrors: typeof errors
    ): Record<string, string[]> => {
      const formattedErrors: Record<string, string[]> = {}
      validationErrors.forEach(error => {
        const { property, constraints } = error
        if (constraints) {
          formattedErrors[property] = Object.values(constraints)
        }
      })
      return formattedErrors
    }

    return convertErrorsToObject(errors)
  }
}
