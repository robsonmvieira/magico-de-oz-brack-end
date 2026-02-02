import { Test, TestingModule } from '@nestjs/testing'
import { LeadController } from './lead.controller'
import {
  ListLeadUseCase,
  CreateLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase,
  SearchLeadUseCase,
  AutocompleteLeadUseCase,
  SearchLeadsByCriteriaUseCase
} from '../use-cases/lead'
import { SearchLocationUseCase } from '../use-cases/lead/search-location/search-location.use-case'

describe('LeadController', () => {
  let controller: LeadController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [
        {
          provide: ListLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: CreateLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: GetLeadByIdUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: UpdateLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: DeleteLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: SearchLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: SearchLocationUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: AutocompleteLeadUseCase,
          useValue: { execute: jest.fn() }
        },
        {
          provide: SearchLeadsByCriteriaUseCase,
          useValue: { execute: jest.fn() }
        }
      ]
    }).compile()

    controller = module.get<LeadController>(LeadController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
