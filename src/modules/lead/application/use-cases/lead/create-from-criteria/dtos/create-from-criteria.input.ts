import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BusinessSector } from '@modules/lead/domain/enums'
import { SearchResultSource } from '../../search-by-criteria/dtos'

class SearchLeadResultPartnerDto {
  @ApiPropertyOptional({
    description: 'Nome do sócio',
    example: 'João da Silva'
  })
  @IsOptional()
  @IsString()
  name: string | null

  @ApiPropertyOptional({
    description: 'CPF/CNPJ do sócio',
    example: '123.456.789-00'
  })
  @IsOptional()
  @IsString()
  doc: string | null

  @ApiPropertyOptional({
    description: 'Qualificação do sócio',
    example: 'Sócio-Administrador'
  })
  @IsOptional()
  @IsString()
  qualification: string | null
}

class SearchLeadResultAddressDto {
  @ApiPropertyOptional({ description: 'Logradouro', example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  street: string | null

  @ApiPropertyOptional({ description: 'Número', example: '123' })
  @IsOptional()
  @IsString()
  number: string | null

  @ApiPropertyOptional({ description: 'Complemento', example: 'Sala 101' })
  @IsOptional()
  @IsString()
  complement: string | null

  @ApiPropertyOptional({ description: 'Bairro', example: 'Centro' })
  @IsOptional()
  @IsString()
  neighborhood: string | null

  @ApiPropertyOptional({ description: 'CEP', example: '01310-100' })
  @IsOptional()
  @IsString()
  zipCode: string | null

  @ApiPropertyOptional({ description: 'Cidade', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city: string | null

  @ApiPropertyOptional({ description: 'Estado', example: 'SP' })
  @IsOptional()
  @IsString()
  state: string | null

  @ApiPropertyOptional({ description: 'País', example: 'Brasil' })
  @IsOptional()
  @IsString()
  country: string | null
}

class SearchLeadResultDto {
  @ApiProperty({
    description: 'Fonte do dado',
    enum: SearchResultSource,
    example: SearchResultSource.RECEITA_FEDERAL
  })
  @IsEnum(SearchResultSource)
  source: SearchResultSource

  @ApiProperty({ description: 'Se já existe como lead no CRM', example: false })
  @IsBoolean()
  existsAsLead: boolean

  @ApiPropertyOptional({
    description: 'ID do lead se já existir',
    example: 'uuid-do-lead'
  })
  @IsOptional()
  @IsString()
  leadId?: string

  @ApiProperty({ description: 'CNPJ básico (8 dígitos)', example: '12345678' })
  @IsString()
  basicCnpj: string

  @ApiProperty({ description: 'CNPJ completo', example: '12.345.678/0001-90' })
  @IsString()
  fullCnpj: string

  @ApiProperty({ description: 'Ordem do estabelecimento', example: '0001' })
  @IsString()
  cnpjOrder: string

  @ApiProperty({ description: 'Dígito verificador', example: '90' })
  @IsString()
  cnpjDv: string

  @ApiProperty({ description: 'Razão social', example: 'Empresa Exemplo LTDA' })
  @IsString()
  companyName: string

  @ApiPropertyOptional({ description: 'Nome fantasia', example: 'Exemplo Bar' })
  @IsOptional()
  @IsString()
  tradeName: string | null

  @ApiProperty({ description: 'Código da natureza jurídica', example: '2062' })
  @IsString()
  legalNatureCode: string

  @ApiProperty({ description: 'Capital social', example: '100000.00' })
  @IsString()
  socialCapital: string

  @ApiProperty({ description: 'Porte da empresa', example: 'ME' })
  @IsString()
  companySize: string

  @ApiProperty({ description: 'Situação cadastral', example: 'ATIVA' })
  @IsString()
  registrationStatus: string

  @ApiPropertyOptional({
    description: 'Data de início da atividade (YYYYMMDD)',
    example: '20200115'
  })
  @IsOptional()
  @IsString()
  activityStartDate: string | null

  @ApiProperty({ description: 'CNAE principal', example: '5611201' })
  @IsString()
  mainCnae: string

  @ApiProperty({
    description: 'Setor de negócio',
    enum: BusinessSector,
    example: BusinessSector.HOSPITALITY
  })
  @IsEnum(BusinessSector)
  sector: BusinessSector

  @ApiPropertyOptional({ description: 'Telefone', example: '11999999999' })
  @IsOptional()
  @IsString()
  phone: string | null

  @ApiPropertyOptional({
    description: 'E-mail',
    example: 'contato@empresa.com.br'
  })
  @IsOptional()
  @IsString()
  email: string | null

  @ApiProperty({
    description: 'Endereço da empresa',
    type: SearchLeadResultAddressDto
  })
  @ValidateNested()
  @Type(() => SearchLeadResultAddressDto)
  address: SearchLeadResultAddressDto

  @ApiProperty({
    description: 'Lista de sócios',
    type: [SearchLeadResultPartnerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchLeadResultPartnerDto)
  partners: SearchLeadResultPartnerDto[]
}

export class CreateFromCriteriaInput {
  @ApiProperty({
    description:
      'Lista de leads selecionados da busca por critérios (Receita Federal). ' +
      'Estes são os objetos retornados pelo endpoint search-by-criteria.',
    type: [SearchLeadResultDto],
    example: [
      {
        source: 'receita_federal',
        existsAsLead: false,
        basicCnpj: '12345678',
        fullCnpj: '12.345.678/0001-90',
        cnpjOrder: '0001',
        cnpjDv: '90',
        companyName: 'Restaurante Exemplo LTDA',
        tradeName: 'Cantina do Zé',
        legalNatureCode: '2062',
        socialCapital: '50000.00',
        companySize: 'ME',
        registrationStatus: 'ATIVA',
        activityStartDate: '20200115',
        mainCnae: '5611201',
        sector: 'hospitality',
        phone: '11999999999',
        email: 'contato@cantina.com.br',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: null,
          neighborhood: 'Centro',
          zipCode: '01310-100',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil'
        },
        partners: [
          {
            name: 'José da Silva',
            doc: '123.456.789-00',
            qualification: 'Sócio-Administrador'
          }
        ]
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchLeadResultDto)
  leads: SearchLeadResultDto[]
}
