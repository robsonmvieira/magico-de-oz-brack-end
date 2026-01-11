export type GoogleMapsPlaceReviewResponse = {
  searchParameters: {
    cid: string
    hl: string
    type: string
    num: number
    page: number
    engine: string
  }
  ll?: string
  placeId?: string
  reviews: GoogleMapsPlaceReview[]
  topics: GoogleMapsPlaceReviewTopic[]
  nextPageToken: string
  credits: number
}

export type GoogleMapsPlaceReview = {
  rating: number
  date: string
  isoDate: string
  snippet: string
  likes: number | null
  user: GoogleMapsPlaceReviewUser
  media: GoogleMapsPlaceReviewMedia[]
  id: string
}

export type GoogleMapsPlaceReviewUser = {
  name: string
  thumbnail: string
  link: string
  reviews: number
  photos: number
}

export type GoogleMapsPlaceReviewMedia = {
  type: string
  imageUrl: string
  caption?: string
}

export type GoogleMapsPlaceReviewTopic = {
  name: string
  reviews: number
  id: string
}
