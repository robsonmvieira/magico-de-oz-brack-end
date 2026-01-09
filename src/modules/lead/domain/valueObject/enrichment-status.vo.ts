import { ValueObject } from '@modules/core/domain/valueObject'

// VO para tracking de enriquecimento
export type EnrichmentStatusProps = {
  googleMaps: { enriched: boolean; at?: Date }
  cnpjWs: { enriched: boolean; at?: Date }
  apollo: { enriched: boolean; at?: Date }
  hunter: { enriched: boolean; at?: Date }
  linkedin: { enriched: boolean; at?: Date }
}
export class EnrichmentStatusVO extends ValueObject {
  readonly googleMaps: { enriched: boolean; at?: Date }
  readonly cnpjWs: { enriched: boolean; at?: Date }
  readonly apollo: { enriched: boolean; at?: Date }
  readonly hunter: { enriched: boolean; at?: Date }
  readonly linkedin: { enriched: boolean; at?: Date }
  private constructor({
    googleMaps,
    cnpjWs,
    apollo,
    hunter,
    linkedin
  }: EnrichmentStatusProps) {
    super()
    this.googleMaps = googleMaps
    this.cnpjWs = cnpjWs
    this.apollo = apollo
    this.hunter = hunter
    this.linkedin = linkedin
  }

  static create({
    googleMaps,
    cnpjWs,
    apollo,
    hunter,
    linkedin
  }: EnrichmentStatusProps): EnrichmentStatusVO {
    return new EnrichmentStatusVO({
      googleMaps,
      cnpjWs,
      apollo,
      hunter,
      linkedin
    })
  }

  static empty(): EnrichmentStatusVO {
    return EnrichmentStatusVO.create({
      googleMaps: { enriched: false },
      cnpjWs: { enriched: false },
      apollo: { enriched: false },
      hunter: { enriched: false },
      linkedin: { enriched: false }
    })
  }

  markEnriched(
    source: 'googleMaps' | 'cnpjWs' | 'apollo' | 'hunter' | 'linkedin'
  ): EnrichmentStatusVO {
    return EnrichmentStatusVO.create({
      googleMaps: this.googleMaps,
      cnpjWs: this.cnpjWs,
      apollo: this.apollo,
      hunter: this.hunter,
      linkedin: this.linkedin,
      [source]: { enriched: true, at: new Date() }
    })
  }

  needsEnrichment(
    source: 'googleMaps' | 'cnpjWs' | 'apollo' | 'hunter' | 'linkedin'
  ): boolean {
    return !this[source].enriched
  }

  completionPercentage(): number {
    const sources = [
      this.googleMaps,
      this.cnpjWs,
      this.apollo,
      this.hunter,
      this.linkedin
    ]
    const enriched = sources.filter(s => s.enriched).length
    return Math.round((enriched / sources.length) * 100)
  }
}
