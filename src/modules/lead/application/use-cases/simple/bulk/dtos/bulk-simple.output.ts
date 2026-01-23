export class BulkSimpleItemOutput {
  id: string
  basicDoc: string
  chooseSimpleModule: string | null
  dateSimpleModuleStart: Date | null
  dateExcludeSimpleModuleStart: Date | null
  chooseMEI: string | null
  dateMEIStart: Date | null
  dateExcludeMEIStart: Date | null
}

export class BulkSimpleOutput {
  imported: number
  items: BulkSimpleItemOutput[]
}
