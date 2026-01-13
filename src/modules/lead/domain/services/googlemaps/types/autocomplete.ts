export type GoogleMapsAutoCompleteSuggestionItem = {
  value: string
}
export type GoogleMapsAutoCompleteResponse = {
  searchParameters: {
    q: string
    gl: string
    hl: string
    uule: string
    type: string
    location: string
    engine: string
  }
  suggestions: GoogleMapsAutoCompleteSuggestionItem[]
  credits: number
}
