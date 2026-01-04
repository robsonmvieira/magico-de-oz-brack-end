import { ValueObject } from '@modules/core/domain/valueObject'

export class CategoryColorVO extends ValueObject {
  private static readonly VALID_COLORS = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'blue',
    'indigo',
    'purple',
    'pink'
  ] as const

  readonly value: string
  constructor(value: string) {
    super()
    this.value = value
  }

  static create(color: string): CategoryColorVO {
    const normalized = color.toLowerCase()
    if (!CategoryColorVO.VALID_COLORS.includes(normalized as any)) {
      throw new Error(
        `Invalid color. Must be one of: ${CategoryColorVO.VALID_COLORS.join(', ')}`
      )
    }
    return new CategoryColorVO(normalized)
  }

  static default(): CategoryColorVO {
    return new CategoryColorVO('gray')
  }
}
