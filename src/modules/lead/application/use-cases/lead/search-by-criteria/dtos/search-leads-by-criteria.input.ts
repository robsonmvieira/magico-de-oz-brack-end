import { IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CompanyIdentifierDto {
  @ApiPropertyOptional({ description: 'Nome da empresa para busca parcial' })
  @IsOptional()
  @IsString()
  companyName?: string

  @ApiPropertyOptional({ description: 'CNPJ da empresa (apenas números)' })
  @IsOptional()
  @IsString()
  cnpj?: string
}

export class SectorFilterDto {
  @ApiPropertyOptional({
    description: 'Setor de atuação (ex: education, technology, health)'
  })
  @IsOptional()
  @IsString()
  sector?: string

  @ApiPropertyOptional({ description: 'Região (ex: sudeste, sul, nordeste)' })
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional({
    description: 'Porte da empresa (ex: small, medium, large)'
  })
  @IsOptional()
  @IsString()
  size?: string
}

export class AdvancedFilterDto {
  @ApiPropertyOptional({ description: 'Faturamento mínimo' })
  @IsOptional()
  @IsString()
  revenueMin?: string

  @ApiPropertyOptional({ description: 'Faturamento máximo' })
  @IsOptional()
  @IsString()
  revenueMax?: string

  @ApiPropertyOptional({ description: 'Número mínimo de funcionários' })
  @IsOptional()
  @IsString()
  employeesMin?: string

  @ApiPropertyOptional({ description: 'Número máximo de funcionários' })
  @IsOptional()
  @IsString()
  employeesMax?: string

  @ApiPropertyOptional({ description: 'Ano de fundação' })
  @IsOptional()
  @IsString()
  foundationYear?: string

  @ApiPropertyOptional({ description: 'Palavras-chave separadas por vírgula' })
  @IsOptional()
  @IsString()
  keywords?: string
}

export class SearchLeadsByCriteriaInput {
  @ApiPropertyOptional({
    description: 'Identificadores da empresa (nome ou CNPJ)'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyIdentifierDto)
  companyIdentifier?: CompanyIdentifierDto

  @ApiPropertyOptional({ description: 'Filtros por setor, região e porte' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SectorFilterDto)
  sectorFilter?: SectorFilterDto

  @ApiPropertyOptional({
    description: 'Filtros avançados (faturamento, funcionários, etc)'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedFilterDto)
  advancedFilter?: AdvancedFilterDto

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number
}
