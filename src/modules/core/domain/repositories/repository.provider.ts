export interface IRepository<TSelect, TInsert = TSelect> {
  save(entity: TInsert): Promise<void>
  update(modelId: string, entity: Partial<TInsert>): Promise<void>
  delete(entity: TSelect): Promise<void>
  findById(id: string): Promise<TSelect | null>
  findAll(): Promise<TSelect[]>
}
