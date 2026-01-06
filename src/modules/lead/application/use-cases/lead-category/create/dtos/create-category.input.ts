import { CategoryColor } from '@modules/lead/application/dtos'

export interface CreateCategoryInput {
  name: string
  description?: string
  priority?: number
  scoreBonus?: number
  keywords?: string[]
  color?: CategoryColor
}
