import { Test, TestingModule } from '@nestjs/testing'
import { LeadController } from './lead.controller'
import {
  ListLeadUseCase,
  CreateLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase
} from '../use-cases/lead'

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
        }
      ]
    }).compile()

    controller = module.get<LeadController>(LeadController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
