import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsEmail,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateNested,
  Matches,
  validateSync
} from 'class-validator'
import { Type } from 'class-transformer'
import { LeadSource } from '@modules/lead/domain/enums'

export const VALID_LEAD_SOURCES = Object.values(LeadSource)

export class AddressDto {
  @ApiProperty({
    description: 'Street name and number',
    example: 'Rua das Flores, 123'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  street: string

  @ApiProperty({
    description: 'City name',
    example: 'São Paulo'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string

  @ApiProperty({
    description: 'State (2 letter code)',
    example: 'SP'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string

  @ApiProperty({
    description: 'ZIP code (CEP)',
    example: '01234-567',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'zipCode must be a valid CEP format' })
  zipCode?: string

  @ApiProperty({
    description: 'Neighborhood name',
    example: 'Centro',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string

  @ApiProperty({
    description: 'Latitude coordinate',
    example: -23.5505,
    required: false
  })
  @IsOptional()
  latitude?: number

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -46.6333,
    required: false
  })
  @IsOptional()
  longitude?: number
}

export interface CreateLeadDtoProps {
  leadCategoryId: string
  companyName: string
  source: LeadSource
  tradeName?: string
  phone?: string
  email?: string
  website?: string
  address?: AddressDto
}

export class CreateLeadDto {
  @ApiProperty({
    description: 'UUID of the lead category',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsUUID()
  leadCategoryId: string

  @ApiProperty({
    description: 'Company legal name (Razão Social)',
    example: 'Empresa ABC LTDA',
    minLength: 2,
    maxLength: 200
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string

  @ApiProperty({
    description: 'Source of the lead',
    enum: LeadSource,
    example: LeadSource.MANUAL
  })
  @IsNotEmpty()
  @IsIn(VALID_LEAD_SOURCES)
  source: LeadSource

  @ApiProperty({
    description: 'Trade name (Nome Fantasia)',
    example: 'ABC Tecnologia',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  tradeName?: string

  @ApiProperty({
    description: 'Phone number (Brazilian format)',
    example: '11987654321',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'phone must be a valid Brazilian phone number (10-11 digits)'
  })
  phone?: string

  @ApiProperty({
    description: 'Email address',
    example: 'contato@empresa.com.br',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://www.empresa.com.br',
    required: false
  })
  @IsOptional()
  @IsUrl()
  website?: string

  @ApiProperty({
    description: 'Company address',
    type: AddressDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto

  constructor(props?: CreateLeadDtoProps) {
    if (!props) return

    this.leadCategoryId = props.leadCategoryId
    this.companyName = props.companyName
    this.source = props.source
    this.tradeName = props.tradeName
    this.phone = props.phone
    this.email = props.email
    this.website = props.website

    if (props.address) {
      this.address = Object.assign(new AddressDto(), props.address)
    }
  }
}

export class CreateLeadDtoValidator {
  static validate(props: CreateLeadDtoProps) {
    const dto = new CreateLeadDto(props)
    const errors = validateSync(dto)

    const convertErrorsToObject = (
      validationErrors: typeof errors,
      parentPath = ''
    ): Record<string, string[]> => {
      const formattedErrors: Record<string, string[]> = {}

      validationErrors.forEach(error => {
        const { property, constraints, children } = error
        const path = parentPath ? `${parentPath}.${property}` : property

        if (constraints) {
          formattedErrors[path] = Object.values(constraints)
        }

        if (children && children.length > 0) {
          const nestedErrors = convertErrorsToObject(children, path)
          Object.assign(formattedErrors, nestedErrors)
        }
      })

      return formattedErrors
    }

    return convertErrorsToObject(errors)
  }
}
