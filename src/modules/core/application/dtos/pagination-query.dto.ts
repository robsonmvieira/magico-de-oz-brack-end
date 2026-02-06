import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator'

export type SortOrder = 'asc' | 'desc'

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiProperty({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder = 'desc'

  @ApiProperty({
    description: 'Search term for filtering results',
    example: 'empresa',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10)
  }

  get take(): number {
    return this.limit ?? 10
  }
}
