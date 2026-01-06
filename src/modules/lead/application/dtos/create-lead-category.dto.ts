import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
  validateSync
} from 'class-validator'

export const VALID_COLORS = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink'
] as const

export type CategoryColor = (typeof VALID_COLORS)[number]

export interface CreateLeadCategoryDtoProps {
  name: string
  description?: string
  priority?: number
  scoreBonus?: number
  keywords?: string[]
  color?: CategoryColor
}

export class CreateLeadCategoryDto {
  @ApiProperty({
    description: 'Name of the lead category',
    example: 'Marketing Digital',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: 'Description of the lead category',
    example: 'Leads interested in digital marketing services',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiProperty({
    description: 'Priority level (1-5, where 5 is highest)',
    example: 3,
    minimum: 1,
    maximum: 5,
    default: 3,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number

  @ApiProperty({
    description: 'Score bonus for leads in this category (-50 to 50)',
    example: 10,
    minimum: -50,
    maximum: 50,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(50)
  scoreBonus?: number

  @ApiProperty({
    description: 'Keywords associated with this category',
    example: ['marketing', 'digital', 'ads'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(50, { each: true })
  keywords?: string[]

  @ApiProperty({
    description: 'Color for the category',
    enum: VALID_COLORS,
    example: 'blue',
    default: 'gray',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_COLORS)
  color?: CategoryColor

  constructor(props?: CreateLeadCategoryDtoProps) {
    if (!props) return

    Object.assign(this, props)
  }
}

export class CreateLeadCategoryDtoValidator {
  static validate(props: CreateLeadCategoryDtoProps) {
    const dto = new CreateLeadCategoryDto(props)
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
