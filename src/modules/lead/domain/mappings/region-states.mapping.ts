export enum BrazilRegion {
  SUDESTE = 'sudeste',
  SUL = 'sul',
  NORDESTE = 'nordeste',
  NORTE = 'norte',
  CENTRO_OESTE = 'centro-oeste'
}

export const BrazilRegionLabels: Record<BrazilRegion, string> = {
  [BrazilRegion.SUDESTE]: 'Sudeste',
  [BrazilRegion.SUL]: 'Sul',
  [BrazilRegion.NORDESTE]: 'Nordeste',
  [BrazilRegion.NORTE]: 'Norte',
  [BrazilRegion.CENTRO_OESTE]: 'Centro-Oeste'
}

export const REGION_STATES: Record<BrazilRegion, string[]> = {
  [BrazilRegion.SUDESTE]: ['SP', 'RJ', 'MG', 'ES'],
  [BrazilRegion.SUL]: ['PR', 'SC', 'RS'],
  [BrazilRegion.NORDESTE]: [
    'BA',
    'SE',
    'AL',
    'PE',
    'PB',
    'RN',
    'CE',
    'PI',
    'MA'
  ],
  [BrazilRegion.NORTE]: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'],
  [BrazilRegion.CENTRO_OESTE]: ['MT', 'MS', 'GO', 'DF']
}

/**
 * Obtém os estados de uma região
 * @param region Nome da região (case-insensitive)
 * @returns Array de UFs ou undefined se região inválida
 */
export function getStatesForRegion(region: string): string[] | undefined {
  const normalizedRegion = region.toLowerCase().trim() as BrazilRegion
  return REGION_STATES[normalizedRegion]
}

/**
 * Obtém a região de um estado
 * @param state UF do estado (ex: SP, RJ)
 * @returns Nome da região ou undefined se estado inválido
 */
export function getRegionForState(state: string): BrazilRegion | undefined {
  const normalizedState = state.toUpperCase().trim()

  for (const [region, states] of Object.entries(REGION_STATES)) {
    if (states.includes(normalizedState)) {
      return region as BrazilRegion
    }
  }

  return undefined
}

/**
 * Verifica se um estado pertence a uma região
 */
export function isStateInRegion(state: string, region: string): boolean {
  const states = getStatesForRegion(region)
  if (!states) return false
  return states.includes(state.toUpperCase().trim())
}
