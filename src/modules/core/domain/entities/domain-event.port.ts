import { UuidVO } from '../valueObject'
import { IIntegrationEvent } from './integration-event.port'

export interface IDomainEvent {
  aggregateId: UuidVO
  aggregateName: string
  aggregateVersion: number
  createdAt: Date
  createdBy: string

  getIntegrationEvent?(): IIntegrationEvent
}
