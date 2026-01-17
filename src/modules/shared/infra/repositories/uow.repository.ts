import { Inject, Injectable } from '@nestjs/common'
import { AggregateRoot } from '@modules/core/domain/entities'
import { IUnitOfWork } from '@modules/core/domain/repositories/unit-of-work.port'
import { DRIZZLE, DrizzleDB, DrizzleTransaction } from '@modules/database'

@Injectable()
export class UnitOfWorkDrizzleRepository implements IUnitOfWork<DrizzleTransaction> {
  private readonly aggregates: Set<AggregateRoot> = new Set()

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async do<T>(fn: (tx: DrizzleTransaction) => Promise<T>): Promise<T> {
    const result = await this.db.transaction(async tx => {
      return fn(tx)
    })

    await this.dispatchEvents()
    this.clear()

    return result
  }

  addAggregate(aggregate: AggregateRoot): void {
    this.aggregates.add(aggregate)
  }

  getAggregates(): AggregateRoot[] {
    return Array.from(this.aggregates)
  }

  private async dispatchEvents(): Promise<void> {
    for (const aggregate of this.aggregates) {
      aggregate.clearEvents()
    }
  }

  private clear(): void {
    this.aggregates.clear()
  }
}
