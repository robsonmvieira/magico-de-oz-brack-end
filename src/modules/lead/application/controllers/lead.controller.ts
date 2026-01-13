import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  ApiBody,
  ApiQuery
} from '@nestjs/swagger'
import { CreateLeadDto, UpdateLeadDto } from '../dtos'
import {
  ListLeadUseCase,
  CreateLeadUseCase,
  GetLeadByIdUseCase,
  UpdateLeadUseCase,
  DeleteLeadUseCase,
  SearchLeadUseCase,
  AutocompleteLeadUseCase
} from '../use-cases/lead'
import { SearchLocationUseCase } from '../use-cases/lead/search-location/search-location.use-case'

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

  @Inject(SearchLeadUseCase)
  private readonly searchLeadUseCase: SearchLeadUseCase

  @Inject(SearchLocationUseCase)
  private readonly searchLocationUseCase: SearchLocationUseCase

  @Inject(AutocompleteLeadUseCase)
  private readonly autocompleteLeadUseCase: AutocompleteLeadUseCase

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

  @Get('search')
  @ApiOperation({
    summary: 'Search leads on Google Maps',
    description:
      'Searches for businesses on Google Maps based on query and location'
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query (e.g., "restaurants", "dentists")',
    type: 'string',
    required: true
  })
  @ApiQuery({
    name: 'location',
    description: 'Location to search in (e.g., "São Paulo, SP")',
    type: 'string',
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error while searching Google Maps'
  })
  async search(
    @Query('query') query: string,
    @Query('country') country: string,
    @Query('location') location: string,
    @Res() res: Response
  ) {
    const result = await this.searchLeadUseCase.execute(
      query,
      country,
      location
    )
    return res.status(result.statusCode).json(result)
  }

  @Get('search-location')
  @ApiOperation({
    summary: 'Search locations by query',
    description:
      'Searches for geographic locations (cities, neighborhoods, regions) by name. Returns a list of matching locations with their Google IDs for use in lead searches.'
  })
  @ApiQuery({
    name: 'query',
    description:
      'Location search term (e.g., "São Paulo", "Pinheiros", "Rio de Janeiro")',
    type: 'string',
    required: true,
    example: 'São Paulo'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Locations retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters'
  })
  async searchLocation(@Query('query') query: string, @Res() res: Response) {
    const result = await this.searchLocationUseCase.execute(query)
    return res.status(result.statusCode).json(result)
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocomplete search suggestions',
    description:
      'Returns autocomplete suggestions for lead searches based on query, country and location. Useful for implementing search-as-you-type functionality in the frontend.'
  })
  @ApiQuery({
    name: 'query',
    description:
      'Partial search term to get suggestions for (e.g., "restaur", "dentis")',
    type: 'string',
    required: true,
    example: 'restaurantes'
  })
  @ApiQuery({
    name: 'country',
    description: 'Country code for search context (e.g., "br" for Brazil)',
    type: 'string',
    required: true,
    example: 'br'
  })
  @ApiQuery({
    name: 'location',
    description:
      'Location context for suggestions (e.g., "São Paulo, SP", "Rio de Janeiro, RJ")',
    type: 'string',
    required: true,
    example: 'São Paulo, SP'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autocomplete suggestions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                example: 'restaurantes italianos'
              }
            }
          }
        },
        hasError: { type: 'boolean', example: false },
        error: { type: 'object', nullable: true },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error while fetching autocomplete suggestions'
  })
  async autocomplete(
    @Query('query') query: string,
    @Query('country') country: string,
    @Query('location') location: string,
    @Res() res: Response
  ) {
    const result = await this.autocompleteLeadUseCase.execute(
      query,
      country,
      location
    )
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
