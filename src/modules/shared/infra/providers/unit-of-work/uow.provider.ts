import { UnitOfWorkDrizzleRepository } from '../../repositories/uow.repository'

export const UOW_PROVIDER = {
  provide: 'IUnitOfWork',
  useClass: UnitOfWorkDrizzleRepository
}
