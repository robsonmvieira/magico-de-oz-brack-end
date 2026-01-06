import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
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
import { CreateLeadCategoryDto, UpdateLeadCategoryDto } from '../dtos'
import { ListCategoryUseCase, CreateCategoryUseCase } from '../use-cases'

@ApiTags('Lead Categories')
@Controller('lead-categories')
export class LeadCategoryController {
  @Inject(ListCategoryUseCase)
  private readonly listCategoryUseCase: ListCategoryUseCase

  @Inject(CreateCategoryUseCase)
  private readonly createCategoryUseCase: CreateCategoryUseCase

  @Post()
  @ApiOperation({
    summary: 'Create a new lead category',
    description: 'Creates a new lead category with the provided data'
  })
  @ApiBody({ type: CreateLeadCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The lead category has been successfully created'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A category with this name already exists'
  })
  async create(
    @Body() createLeadCategoryDto: CreateLeadCategoryDto,
    @Res() res: Response
  ) {
    const result = await this.createCategoryUseCase.execute({
      name: createLeadCategoryDto.name,
      description: createLeadCategoryDto.description,
      priority: createLeadCategoryDto.priority,
      scoreBonus: createLeadCategoryDto.scoreBonus,
      keywords: createLeadCategoryDto.keywords,
      color: createLeadCategoryDto.color
    })

    return res.status(result.statusCode).json(result)
  }

  @Get()
  @ApiOperation({
    summary: 'Get all lead categories',
    description: 'Returns a list of all lead categories'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of lead categories retrieved successfully'
  })
  async findAll(@Res() res: Response) {
    const result = await this.listCategoryUseCase.execute()
    return res.status(result.statusCode).json(result)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a lead category by ID',
    description: 'Returns a single lead category by its UUID'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead category',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead category retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implement findOne logic
    return { message: 'Get lead category', id }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a lead category',
    description: 'Updates an existing lead category with the provided data'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead category',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ type: UpdateLeadCategoryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead category updated successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadCategoryDto: UpdateLeadCategoryDto
  ) {
    // TODO: Implement update logic
    return { message: 'Update lead category', id, data: updateLeadCategoryDto }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a lead category',
    description: 'Soft deletes a lead category by its UUID'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead category',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Lead category deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implement remove logic
    return { message: 'Delete lead category', id }
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate a lead category',
    description: 'Activates a previously deactivated lead category'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead category',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead category activated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implement activate logic
    return { message: 'Activate lead category', id }
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a lead category',
    description: 'Deactivates an active lead category'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead category',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead category deactivated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead category not found'
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implement deactivate logic
    return { message: 'Deactivate lead category', id }
  }
}
