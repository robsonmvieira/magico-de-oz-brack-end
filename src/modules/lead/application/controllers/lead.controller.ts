import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common'
import { LeadService } from '../../lead.service'
import { CreateLeadDto } from '../dtos/create-lead.dto'
import { UpdateLeadDto } from '../dtos/update-lead.dto'

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto)
  }

  @Get()
  findAll() {
    return this.leadService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.update(+id, updateLeadDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadService.remove(+id)
  }
}
