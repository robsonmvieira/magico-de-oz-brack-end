import { IRepository } from '../../domain/repositories'

export abstract class BaseRepository<T> implements IRepository<T> {
  // constructor(protected repo: Repository<T>) {}

  async save(entity: T): Promise<void> {
    console.log('save', entity)
  }
  async update(modelId: string, entity: Partial<T>): Promise<void> {
    console.log('update', modelId, entity)
  }
  async delete(entity: T): Promise<void> {
    console.log('delete', entity)
  }
  async findById(id: string): Promise<T> {
    console.log('findById', id)
    return null
  }
  async findAll(): Promise<T[]> {
    console.log('findAll')
    return []
  }
}
