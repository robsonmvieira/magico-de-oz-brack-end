/**
 * Google Places API - Place Details Response Types
 * @see https://developers.google.com/maps/documentation/places/web-service/details
 */

// ============================================
// Core Types
// ============================================

/**
 * Represents a complete Google Place with all available details
 */
export interface GooglePlace {
  name: string
  id: string
  types: string[]
  nationalPhoneNumber: string
  internationalPhoneNumber: string
  formattedAddress: string
  addressComponents: GooglePlaceAddressComponent[]
  plusCode: GooglePlacePlusCode
  location: GooglePlaceCoordinates
  viewport: GooglePlaceViewport
  rating: number
  googleMapsUri: string
  websiteUri: string
  regularOpeningHours: GooglePlaceOpeningHours
  utcOffsetMinutes: number
  adrFormatAddress: string
  businessStatus: string
  priceLevel: string
  userRatingCount: number
  iconMaskBaseUri: string
  iconBackgroundColor: string
  displayName: GooglePlaceLocalizedText
  primaryTypeDisplayName: GooglePlaceLocalizedText
  takeout: boolean
  delivery: boolean
  dineIn: boolean
  reservable: boolean
  servesBreakfast: boolean
  servesLunch: boolean
  servesDinner: boolean
  servesBeer: boolean
  servesWine: boolean
  servesVegetarianFood: boolean
  currentOpeningHours: GooglePlaceCurrentOpeningHours
  primaryType: string
  shortFormattedAddress: string
  editorialSummary: GooglePlaceLocalizedText
  reviews: GooglePlaceReview[]
  photos: GooglePlacePhoto[]
  outdoorSeating: boolean
  liveMusic: boolean
  menuForChildren: boolean
  servesCocktails: boolean
  servesDessert: boolean
  servesCoffee: boolean
  goodForChildren: boolean
  allowsDogs: boolean
  restroom: boolean
  goodForGroups: boolean
  goodForWatchingSports: boolean
  paymentOptions: GooglePlacePaymentOptions
  parkingOptions: GooglePlaceParkingOptions
  accessibilityOptions: GooglePlaceAccessibilityOptions
  addressDescriptor: GooglePlaceAddressDescriptor
  googleMapsLinks: GooglePlaceLinks
  reviewSummary: GooglePlaceReviewSummary
  timeZone: GooglePlaceTimeZone
  postalAddress: GooglePlacePostalAddress
}

// ============================================
// Address Types
// ============================================

export interface GooglePlaceAddressComponent {
  longText: string
  shortText: string
  types: string[]
  languageCode: string
}

export interface GooglePlacePlusCode {
  globalCode: string
  compoundCode: string
}

export interface GooglePlacePostalAddress {
  regionCode: string
  languageCode: string
  postalCode: string
  administrativeArea: string
  locality: string
  sublocality: string
  addressLines: string[]
}

// ============================================
// Location Types
// ============================================

export interface GooglePlaceCoordinates {
  latitude: number
  longitude: number
}

export interface GooglePlaceViewport {
  low: GooglePlaceCoordinates
  high: GooglePlaceCoordinates
}

// ============================================
// Opening Hours Types
// ============================================

export interface GooglePlaceOpeningHours {
  openNow: boolean
  periods: GooglePlaceOpeningPeriod[]
  weekdayDescriptions: string[]
  nextOpenTime: string
}

export interface GooglePlaceOpeningPeriod {
  open: GooglePlaceTimeOfDay
  close: GooglePlaceTimeOfDay
}

export interface GooglePlaceTimeOfDay {
  day: number
  hour: number
  minute: number
}

export interface GooglePlaceCurrentOpeningHours {
  openNow: boolean
  periods: GooglePlaceCurrentOpeningPeriod[]
  weekdayDescriptions: string[]
  nextOpenTime: string
}

export interface GooglePlaceCurrentOpeningPeriod {
  open: GooglePlaceTimeOfDayWithDate
  close: GooglePlaceTimeOfDayWithDate
}

export interface GooglePlaceTimeOfDayWithDate {
  day: number
  hour: number
  minute: number
  date: GooglePlaceDate
}

export interface GooglePlaceDate {
  year: number
  month: number
  day: number
}

// ============================================
// Review Types
// ============================================

export interface GooglePlaceReview {
  name: string
  relativePublishTimeDescription: string
  rating: number
  text: GooglePlaceLocalizedText
  originalText: GooglePlaceLocalizedText
  authorAttribution: GooglePlaceAuthorAttribution
  publishTime: string
  flagContentUri: string
  googleMapsUri: string
}

export interface GooglePlaceAuthorAttribution {
  displayName: string
  uri: string
  photoUri: string
}

export interface GooglePlaceReviewSummary {
  text: GooglePlaceLocalizedText
  flagContentUri: string
  disclosureText: GooglePlaceLocalizedText
  reviewsUri: string
}

// ============================================
// Photo Types
// ============================================

export interface GooglePlacePhoto {
  name: string
  widthPx: number
  heightPx: number
  authorAttributions: GooglePlaceAuthorAttribution[]
  flagContentUri: string
  googleMapsUri: string
}

// ============================================
// Options Types
// ============================================

export interface GooglePlacePaymentOptions {
  acceptsCreditCards: boolean
  acceptsDebitCards: boolean
  acceptsCashOnly: boolean
  acceptsNfc: boolean
}

export interface GooglePlaceParkingOptions {
  freeParkingLot: boolean
  freeStreetParking: boolean
}

export interface GooglePlaceAccessibilityOptions {
  wheelchairAccessibleParking: boolean
  wheelchairAccessibleEntrance: boolean
  wheelchairAccessibleRestroom: boolean
  wheelchairAccessibleSeating: boolean
}

// ============================================
// Address Descriptor Types
// ============================================

export interface GooglePlaceAddressDescriptor {
  landmarks: GooglePlaceLandmark[]
  areas: GooglePlaceArea[]
}

export interface GooglePlaceLandmark {
  name: string
  placeId: string
  displayName: GooglePlaceLocalizedText
  types: string[]
  spatialRelationship: string
  straightLineDistanceMeters: number
  travelDistanceMeters: number
}

export interface GooglePlaceArea {
  name: string
  placeId: string
  displayName: GooglePlaceLocalizedText
  containment: string
}

// ============================================
// Links & Metadata Types
// ============================================

export interface GooglePlaceLinks {
  directionsUri: string
  placeUri: string
  writeAReviewUri: string
  reviewsUri: string
  photosUri: string
}

export interface GooglePlaceTimeZone {
  id: string
}

// ============================================
// Common/Shared Types
// ============================================

/**
 * Represents text with associated language code
 * Used for displayName, editorialSummary, review text, etc.
 */
export interface GooglePlaceLocalizedText {
  text: string
  languageCode: string
}

export interface GooglePlaceResponse {
  places: any[]
}
