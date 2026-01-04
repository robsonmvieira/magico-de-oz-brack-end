import { Injectable } from '@nestjs/common'
import { CreateLeadDto } from './application/dto/create-lead.dto'
import { UpdateLeadDto } from './application/dto/update-lead.dto'

@Injectable()
export class LeadService {
  create(createLeadDto: CreateLeadDto) {
    console.log(createLeadDto)
    return 'This action adds a new lead'
  }

  findAll() {
    return `This action returns all lead`
  }

  findOne(id: number) {
    return `This action returns a #${id} lead`
  }

  update(id: number, updateLeadDto: UpdateLeadDto) {
    console.log(updateLeadDto)
    return `This action updates a #${id} lead`
  }

  remove(id: number) {
    return `This action removes a #${id} lead`
  }
}
