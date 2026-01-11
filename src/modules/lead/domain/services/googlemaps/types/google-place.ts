export type GoogleMapsPlaceResponse = {
  searchParameters: {
    q: string
    hl: string
    type: string
    num: number
    page: number
    engine: string
  }
  ll: string
  places: GoogleMapsPlace[]
  credits: number
}

export type GoogleMapsPlace = {
  position: number
  title: string
  address: string
  latitude: number
  longitude: number
  rating: number
  ratingCount: number
  priceLevel: string
  type: string
  types: string[]
}
