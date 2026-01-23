export interface BulkSimpleItemInput {
  basicDoc: string
  chooseSimpleModule?: string
  dateSimpleModuleStart?: Date
  dateExcludeSimpleModuleStart?: Date
  chooseMEI?: string
  dateMEIStart?: Date
  dateExcludeMEIStart?: Date
}

export interface BulkSimpleInput {
  items: BulkSimpleItemInput[]
}
