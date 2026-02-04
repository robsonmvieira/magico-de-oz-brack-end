import {
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsEnum,
  IsArray
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { BusinessSector } from '@modules/lead/domain/enums'
import { BrazilRegion } from '@modules/lead/domain/mappings'

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
    description: 'Setor de atuação',
    enum: BusinessSector,
    example: BusinessSector.TECH
  })
  @IsOptional()
  @IsEnum(BusinessSector)
  sector?: BusinessSector

  @ApiPropertyOptional({
    description: 'Região do Brasil',
    enum: BrazilRegion,
    example: BrazilRegion.SUDESTE
  })
  @IsOptional()
  @IsEnum(BrazilRegion)
  region?: BrazilRegion

  @ApiPropertyOptional({
    description: 'Estados específicos (UFs)',
    example: ['SP', 'RJ'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[]

  @ApiPropertyOptional({
    description:
      'Porte da empresa (código Receita Federal: 01=ME, 03=EPP, 05=Demais)',
    example: '03'
  })
  @IsOptional()
  @IsString()
  size?: string
}

export class AdvancedFilterDto {
  @ApiPropertyOptional({
    description: 'Termo de busca livre (nome fantasia ou razão social)',
    example: 'Restaurante Pavuna'
  })
  @IsOptional()
  @IsString()
  term?: string

  @ApiPropertyOptional({
    description: 'Ano de fundação (empresas fundadas a partir deste ano)',
    example: '2018'
  })
  @IsOptional()
  @IsString()
  foundationYear?: string

  @ApiPropertyOptional({
    description:
      'Palavras-chave para busca em nome e descrição CNAE (separadas por vírgula)',
    example: 'Gourmet, delivery, alimentação'
  })
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
