import { ValueObject } from '@modules/core/domain/valueObject'

// VO para classificação (setor/porte com confiança)
export type ClassificationProps = {
  value: string
  confidence: number
  method: 'keywords' | 'ai' | 'manual'
}
export class ClassificationVO extends ValueObject {
  readonly value: string
  readonly confidence: number
  readonly method: 'keywords' | 'ai' | 'manual'
  private constructor({ value, confidence, method }: ClassificationProps) {
    super()
    this.value = value
    this.confidence = confidence
    this.method = method
  }

  static create({
    value,
    confidence,
    method
  }: ClassificationProps): ClassificationVO {
    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be between 0 and 100')
    }
    return new ClassificationVO({ value, confidence, method })
  }

  isHighConfidence(): boolean {
    return this.confidence >= 70
  }
}
