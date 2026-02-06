import { PaginatedResult, PaginationParams } from './pagination.interface'

export interface IRepository<
  TSelect,
  TInsert = TSelect,
  TTransaction = unknown
> {
  save(entity: TInsert, tx?: TTransaction): Promise<void>
  update(
    modelId: string,
    entity: Partial<TInsert>,
    tx?: TTransaction
  ): Promise<void>
  delete(entity: TSelect, tx?: TTransaction): Promise<void>
  findById(id: string, tx?: TTransaction): Promise<TSelect | null>
  findAll(tx?: TTransaction): Promise<TSelect[]>
  findAllPaginated(
    params: PaginationParams,
    tx?: TTransaction
  ): Promise<PaginatedResult<TSelect>>
  count(tx?: TTransaction): Promise<number>
}
