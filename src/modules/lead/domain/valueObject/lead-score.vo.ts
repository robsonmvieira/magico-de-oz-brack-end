import { ValueObject } from '@modules/core/domain/valueObject'

export type LeadScoreProps = {
  completeness: number
  icpFit: number
  engagement: number
}
export class LeadScoreVO extends ValueObject {
  readonly completeness: number // 0-100: quão completo está o cadastro
  readonly icpFit: number // 0-100: quão bem encaixa no ICP do cliente
  readonly engagement: number // 0-100: interações (futuro)
  private constructor({ completeness, icpFit, engagement }: LeadScoreProps) {
    super()
    this.completeness = completeness
    this.icpFit = icpFit
    this.engagement = engagement
  }

  static create({
    completeness,
    icpFit,
    engagement
  }: LeadScoreProps): LeadScoreVO {
    return new LeadScoreVO({
      completeness: Math.min(100, Math.max(0, completeness)),
      icpFit: Math.min(100, Math.max(0, icpFit)),
      engagement: Math.min(100, Math.max(0, engagement))
    })
  }

  static empty(): LeadScoreVO {
    return new LeadScoreVO({
      completeness: 0,
      icpFit: 0,
      engagement: 0
    })
  }

  total(): number {
    // Peso: completude 30%, ICP 50%, engagement 20%
    return Math.round(
      this.completeness * 0.3 + this.icpFit * 0.5 + this.engagement * 0.2
    )
  }
}
