import { ValueObject } from '@modules/core/domain/valueObject'

export type GoogleMapsDataProps = {
  placeId: string
  category: string
  rating?: number
  reviewsCount?: number
}
export class GoogleMapsDataVO extends ValueObject {
  readonly placeId: string
  readonly category: string
  readonly rating?: number
  readonly reviewsCount?: number
  private constructor({
    placeId,
    category,
    rating,
    reviewsCount
  }: GoogleMapsDataProps) {
    super()
    this.placeId = placeId
    this.category = category
    this.rating = rating
    this.reviewsCount = reviewsCount
  }
  static create(value: GoogleMapsDataProps): GoogleMapsDataVO {
    return new GoogleMapsDataVO(value)
  }

  hasGoodRating(): boolean {
    return (this.rating ?? 0) >= 4
  }

  hasSignificantReviews(): boolean {
    return (this.reviewsCount ?? 0) >= 10
  }
}
