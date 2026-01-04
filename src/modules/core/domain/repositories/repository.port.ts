export interface IRepository<T> {
  save(entity: T): Promise<void>
  update(modelId: string, entity: T): Promise<void>
  delete(entity: T): Promise<void>
  findById(id: string): Promise<T>
  findAll(): Promise<T[]>
}
