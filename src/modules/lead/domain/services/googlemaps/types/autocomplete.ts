export type GoogleMapsAutoCompleteSuggestionItem = {
  placePrediction: {
    place: string
    placeId: string
    text: {
      text: string
    }
    structuredFormat: {
      mainText: {
        text: string
      }
      secondaryText: {
        text: string
      }
    }
    types: string[]
  }
}

export type GoogleMapsAutoCompleteResponse = {
  suggestions: GoogleMapsAutoCompleteSuggestionItem[]
}
