import { AggregateRoot } from '../entities'

export interface IUnitOfWork<TTransaction = unknown> {
  do<T>(fn: (tx: TTransaction) => Promise<T>): Promise<T>
  addAggregate(aggregate: AggregateRoot): void
  getAggregates(): AggregateRoot[]
}
