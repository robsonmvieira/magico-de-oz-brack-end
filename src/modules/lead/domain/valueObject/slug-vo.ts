import { ValueObject } from '@modules/core/domain/valueObject'

export class SlugVO extends ValueObject {
  readonly value: string
  constructor(value: string) {
    super()
    this.value = value
  }

  static fromName(name: string): SlugVO {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')

    return new SlugVO(slug)
  }

  static create(value: string): SlugVO {
    return new SlugVO(value)
  }
}
