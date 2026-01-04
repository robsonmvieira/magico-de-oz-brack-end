import { BaseException } from './base.exception'

export class UuidException extends BaseException {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
