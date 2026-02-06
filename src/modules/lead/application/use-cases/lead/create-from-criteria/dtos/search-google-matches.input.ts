import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { SearchLeadResult } from '../../search-by-criteria/dtos'

export class SearchGoogleMatchesInput {
  @ApiProperty({
    description: 'Lista de leads selecionados da busca por critérios',
    type: [Object]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  leads: SearchLeadResult[]

  @ApiProperty({
    description: 'ID da categoria para os novos leads'
  })
  @IsUUID()
  @IsString()
  leadCategoryId: string
}
