export interface IIntegrationEvent<T = any> {
  data: T
  createdAt: Date
  createdBy: string
  eventName: string
  eventVersion: number
}
