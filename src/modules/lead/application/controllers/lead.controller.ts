import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
  Res
} from '@nestjs/common'
import { Response } from 'express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger'
import { CreateLeadDto, UpdateLeadDto } from '../dtos'
import {
  ListLeadUseCase,
  CreateLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase
} from '../use-cases/lead'

@ApiTags('Leads')
@Controller('leads')
export class LeadController {
  @Inject(ListLeadUseCase)
  private readonly listLeadUseCase: ListLeadUseCase

  @Inject(CreateLeadUseCase)
  private readonly createLeadUseCase: CreateLeadUseCase

  @Inject(GetLeadByIdUseCase)
  private readonly getLeadByIdUseCase: GetLeadByIdUseCase

  @Inject(UpdateLeadUseCase)
  private readonly updateLeadUseCase: UpdateLeadUseCase

  @Inject(DeleteLeadUseCase)
  private readonly deleteLeadUseCase: DeleteLeadUseCase

  @Post()
  @ApiOperation({
    summary: 'Create a new lead',
    description: 'Creates a new lead with the provided data'
  })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The lead has been successfully created'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A lead with this company name or email already exists'
  })
  async create(@Body() createLeadDto: CreateLeadDto, @Res() res: Response) {
    const result = await this.createLeadUseCase.execute({
      leadCategoryId: createLeadDto.leadCategoryId,
      companyName: createLeadDto.companyName,
      source: createLeadDto.source,
      tradeName: createLeadDto.tradeName,
      phone: createLeadDto.phone,
      email: createLeadDto.email,
      website: createLeadDto.website,
      address: createLeadDto.address
    })

    return res.status(result.statusCode).json(result)
  }

  @Get()
  @ApiOperation({
    summary: 'Get all leads',
    description: 'Returns a list of all leads'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of leads retrieved successfully'
  })
  async findAll(@Res() res: Response) {
    const result = await this.listLeadUseCase.execute()
    return res.status(result.statusCode).json(result)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a lead by ID',
    description: 'Returns a single lead by its UUID'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead not found'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.getLeadByIdUseCase.execute(id)
    return res.status(result.statusCode).json(result)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a lead',
    description: 'Updates an existing lead with the provided data'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead updated successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A lead with this company name or email already exists'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Res() res: Response
  ) {
    const result = await this.updateLeadUseCase.execute(id, {
      leadCategoryId: updateLeadDto.leadCategoryId,
      companyName: updateLeadDto.companyName,
      tradeName: updateLeadDto.tradeName,
      phone: updateLeadDto.phone,
      email: updateLeadDto.email,
      website: updateLeadDto.website,
      address: updateLeadDto.address
    })

    return res.status(result.statusCode).json(result)
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a lead',
    description: 'Soft deletes a lead by its UUID'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead not found'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.deleteLeadUseCase.execute(id)
    return res.status(result.statusCode).json(result)
  }
}
