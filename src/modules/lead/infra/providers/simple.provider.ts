import {
  BulkSimpleUseCase,
  FindSimpleByCnpjUseCase,
  ImportSimpleUseCase,
  ImportSimpleFromFileUseCase
} from '@modules/lead/application/use-cases/simple'
import { SimpleCsvParserProvider } from '../services/simple-csv-parser.provider'

const SERVICE_PROVIDERS = {
  SimpleCsvParserProvider: {
    provide: 'ISimpleCsvParserProvider',
    useClass: SimpleCsvParserProvider
  }
} as const

const USE_CASES_PROVIDERS = {
  ImportSimpleUseCase: {
    provide: ImportSimpleUseCase,
    useClass: ImportSimpleUseCase
  },
  BulkSimpleUseCase: {
    provide: BulkSimpleUseCase,
    useClass: BulkSimpleUseCase
  },
  FindSimpleByCnpjUseCase: {
    provide: FindSimpleByCnpjUseCase,
    useClass: FindSimpleByCnpjUseCase
  },
  ImportSimpleFromFileUseCase: {
    provide: ImportSimpleFromFileUseCase,
    useClass: ImportSimpleFromFileUseCase
  }
} as const

export const SIMPLE_PROVIDERS = {
  SERVICE_PROVIDERS,
  USE_CASES_PROVIDERS
}
