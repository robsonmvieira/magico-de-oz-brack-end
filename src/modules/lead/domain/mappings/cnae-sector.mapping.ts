import { BusinessSector } from '../enums'

/**
 * Mapeamento de Divisões CNAE (2 primeiros dígitos) para Setores de Negócio
 *
 * Baseado na estrutura oficial do IBGE:
 * https://cnae.ibge.gov.br/
 *
 * Divisões CNAE:
 * - 01-03: Agricultura, Pecuária, Pesca
 * - 05-09: Indústrias Extrativas
 * - 10-33: Indústrias de Transformação
 * - 35-39: Eletricidade, Gás, Água, Esgoto
 * - 41-43: Construção
 * - 45-47: Comércio
 * - 49-53: Transporte, Armazenagem, Correio
 * - 55-56: Alojamento e Alimentação
 * - 58-63: Informação e Comunicação
 * - 64-66: Atividades Financeiras
 * - 68: Atividades Imobiliárias
 * - 69-82: Atividades Profissionais, Científicas, Administrativas
 * - 84: Administração Pública
 * - 85: Educação
 * - 86-88: Saúde e Serviços Sociais
 * - 90-99: Artes, Cultura, Esporte, Outras Atividades
 */

type CnaeDivisionMapping = {
  divisions: string[]
  sector: BusinessSector
  description: string
}

export const CNAE_SECTOR_MAPPINGS: CnaeDivisionMapping[] = [
  // Agronegócio (Divisões 01-03)
  {
    divisions: ['01', '02', '03'],
    sector: BusinessSector.AGRO,
    description:
      'Agricultura, Pecuária, Produção Florestal, Pesca e Aquicultura'
  },

  // Indústria - Extrativa (Divisões 05-09)
  {
    divisions: ['05', '06', '07', '08', '09'],
    sector: BusinessSector.INDUSTRY,
    description: 'Indústrias Extrativas (Mineração, Petróleo, Gás)'
  },

  // Indústria - Transformação (Divisões 10-33)
  {
    divisions: [
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33'
    ],
    sector: BusinessSector.INDUSTRY,
    description: 'Indústrias de Transformação'
  },

  // Serviços (Utilidades - Divisões 35-39) - Classificado como Serviços
  {
    divisions: ['35', '36', '37', '38', '39'],
    sector: BusinessSector.SERVICES,
    description: 'Eletricidade, Gás, Água, Esgoto, Gestão de Resíduos'
  },

  // Construção Civil (Divisões 41-43)
  {
    divisions: ['41', '42', '43'],
    sector: BusinessSector.CONSTRUCTION,
    description: 'Construção de Edifícios, Obras de Infraestrutura'
  },

  // Varejo/Comércio (Divisões 45-47)
  {
    divisions: ['45', '46', '47'],
    sector: BusinessSector.RETAIL,
    description: 'Comércio de Veículos, Atacado e Varejo'
  },

  // Transporte e Logística (Divisões 49-53)
  {
    divisions: ['49', '50', '51', '52', '53'],
    sector: BusinessSector.LOGISTICS,
    description: 'Transporte Terrestre, Aquaviário, Aéreo, Armazenagem, Correio'
  },

  // Hotelaria e Alimentação (Divisões 55-56)
  {
    divisions: ['55', '56'],
    sector: BusinessSector.HOSPITALITY,
    description: 'Alojamento e Alimentação'
  },

  // Tecnologia (Divisões 62-63)
  {
    divisions: ['62', '63'],
    sector: BusinessSector.TECH,
    description:
      'Tecnologia da Informação, Desenvolvimento de Software, Processamento de Dados'
  },

  // Mídia/Comunicação (Divisões 58-61) - Classificado como Serviços
  {
    divisions: ['58', '59', '60', '61'],
    sector: BusinessSector.SERVICES,
    description: 'Edição, Mídia, Telecomunicações'
  },

  // Financeiro (Divisões 64-66)
  {
    divisions: ['64', '65', '66'],
    sector: BusinessSector.FINANCE,
    description:
      'Atividades Financeiras, Seguros, Previdência, Serviços Financeiros'
  },

  // Imobiliário (Divisão 68)
  {
    divisions: ['68'],
    sector: BusinessSector.REAL_ESTATE,
    description: 'Atividades Imobiliárias'
  },

  // Serviços Profissionais (Divisões 69-75, 77-82)
  {
    divisions: [
      '69',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '77',
      '78',
      '79',
      '80',
      '81',
      '82'
    ],
    sector: BusinessSector.SERVICES,
    description:
      'Atividades Profissionais, Científicas, Técnicas e Administrativas'
  },

  // Administração Pública (Divisão 84) - Classificado como Serviços
  {
    divisions: ['84'],
    sector: BusinessSector.SERVICES,
    description: 'Administração Pública, Defesa, Seguridade Social'
  },

  // Educação (Divisão 85)
  {
    divisions: ['85'],
    sector: BusinessSector.EDUCATION,
    description: 'Educação'
  },

  // Saúde (Divisões 86-88)
  {
    divisions: ['86', '87', '88'],
    sector: BusinessSector.HEALTH,
    description: 'Saúde Humana e Serviços Sociais'
  },

  // Artes, Cultura, Esporte e Outros (Divisões 90-99)
  {
    divisions: ['90', '91', '92', '93', '94', '95', '96', '97', '99'],
    sector: BusinessSector.SERVICES,
    description: 'Artes, Cultura, Esporte, Recreação e Outras Atividades'
  }
]

/**
 * Mapa otimizado para lookup rápido: Divisão CNAE -> Setor
 */
export const CNAE_DIVISION_TO_SECTOR: Map<string, BusinessSector> = new Map(
  CNAE_SECTOR_MAPPINGS.flatMap(mapping =>
    mapping.divisions.map(division => [division, mapping.sector])
  )
)

/**
 * Obtém o setor de negócio a partir de um código CNAE
 * @param cnaeCode Código CNAE (pode ser 2, 5 ou 7 dígitos)
 * @returns BusinessSector correspondente ou SERVICES como fallback
 */
export function getSectorFromCnae(cnaeCode: string | null): BusinessSector {
  if (!cnaeCode) {
    return BusinessSector.SERVICES
  }

  // Normaliza removendo caracteres não numéricos
  const normalizedCode = cnaeCode.replace(/\D/g, '')

  if (normalizedCode.length < 2) {
    return BusinessSector.SERVICES
  }

  // Extrai os 2 primeiros dígitos (divisão)
  const division = normalizedCode.substring(0, 2)

  return CNAE_DIVISION_TO_SECTOR.get(division) ?? BusinessSector.SERVICES
}

/**
 * Obtém todas as divisões CNAE para um determinado setor
 * @param sector Setor de negócio
 * @returns Array de divisões CNAE (2 dígitos)
 */
export function getCnaeDivisionsForSector(sector: BusinessSector): string[] {
  return CNAE_SECTOR_MAPPINGS.filter(
    mapping => mapping.sector === sector
  ).flatMap(mapping => mapping.divisions)
}

/**
 * Verifica se um código CNAE pertence a um determinado setor
 * @param cnaeCode Código CNAE
 * @param sector Setor a verificar
 * @returns true se o CNAE pertence ao setor
 */
export function isCnaeInSector(
  cnaeCode: string | null,
  sector: BusinessSector
): boolean {
  return getSectorFromCnae(cnaeCode) === sector
}
