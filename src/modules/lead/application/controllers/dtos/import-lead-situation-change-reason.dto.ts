import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max
} from 'class-validator'
import { Type } from 'class-transformer'

export class ImportLeadSituationChangeReasonOptionsDto {
  @ApiPropertyOptional({
    description: 'Batch size for bulk inserts',
    example: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  @Type(() => Number)
  batchSize?: number

  @ApiPropertyOptional({ description: 'CSV delimiter character', example: ';' })
  @IsOptional()
  @IsString()
  delimiter?: string

  @ApiPropertyOptional({ description: 'Skip header row', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  skipHeader?: boolean
}
