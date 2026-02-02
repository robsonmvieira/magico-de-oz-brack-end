export enum BusinessSector {
  TECH = 'tech',
  FINANCE = 'finance',
  HEALTH = 'health',
  EDUCATION = 'education',
  RETAIL = 'retail',
  INDUSTRY = 'industry',
  AGRO = 'agro',
  CONSTRUCTION = 'construction',
  LOGISTICS = 'logistics',
  HOSPITALITY = 'hospitality',
  REAL_ESTATE = 'real_estate',
  SERVICES = 'services'
}

export const BusinessSectorLabels: Record<BusinessSector, string> = {
  [BusinessSector.TECH]: 'Tecnologia',
  [BusinessSector.FINANCE]: 'Financeiro',
  [BusinessSector.HEALTH]: 'Saúde',
  [BusinessSector.EDUCATION]: 'Educação',
  [BusinessSector.RETAIL]: 'Varejo',
  [BusinessSector.INDUSTRY]: 'Indústria',
  [BusinessSector.AGRO]: 'Agronegócio',
  [BusinessSector.CONSTRUCTION]: 'Construção Civil',
  [BusinessSector.LOGISTICS]: 'Transporte e Logística',
  [BusinessSector.HOSPITALITY]: 'Hotelaria e Alimentação',
  [BusinessSector.REAL_ESTATE]: 'Imobiliário',
  [BusinessSector.SERVICES]: 'Serviços Gerais'
}
