import { SearchLeadResult } from '../../search-by-criteria/dtos'

export interface GooglePlaceSuggestion {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingCount?: number
  phone?: string
  website?: string
}

export interface GooglePlaceMatch {
  receitaFederalData: SearchLeadResult
  googlePlaces: GooglePlaceSuggestion[]
}

export class SearchGoogleMatchesOutput {
  matches: GooglePlaceMatch[]
  notFound: SearchLeadResult[]

  constructor(data: {
    matches: GooglePlaceMatch[]
    notFound: SearchLeadResult[]
  }) {
    this.matches = data.matches
    this.notFound = data.notFound
  }
}
