import { UuidVO } from '../valueObject'

export interface DefaultEntityProps {
  id?: UuidVO
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
  is_active?: boolean
  is_deleted?: boolean
  is_blocked?: boolean
}
