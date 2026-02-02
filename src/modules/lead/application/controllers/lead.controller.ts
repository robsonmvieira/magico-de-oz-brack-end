import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  AutocompleteLeadUseCase,
  SearchLeadsByCriteriaUseCase,
  SearchLeadsByCriteriaInput
} from '../use-cases/lead'
import { SearchLocationUseCase } from '../use-cases/lead/search-location/search-location.use-case'
import {
  SearchByCriteriaSwagger,
  CreateLeadSwagger,
  ListLeadsSwagger,
  GetLeadByIdSwagger,
  UpdateLeadSwagger,
  DeleteLeadSwagger,
  SearchLeadSwagger,
  SearchLocationSwagger,
  AutocompleteSwagger
} from '../swagger'

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

  @Inject(SearchLeadsByCriteriaUseCase)
  private readonly searchLeadsByCriteriaUseCase: SearchLeadsByCriteriaUseCase

  @Post()
  @ApiOperation(CreateLeadSwagger.operation)
  @ApiBody(CreateLeadSwagger.body)
  @ApiResponse(CreateLeadSwagger.responses.created)
  @ApiResponse(CreateLeadSwagger.responses.badRequest)
  @ApiResponse(CreateLeadSwagger.responses.notFound)
  @ApiResponse(CreateLeadSwagger.responses.conflict)
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
  @ApiOperation(ListLeadsSwagger.operation)
  @ApiResponse(ListLeadsSwagger.responses.success)
  async findAll(@Res() res: Response) {
    const result = await this.listLeadUseCase.execute()
    return res.status(result.statusCode).json(result)
  }

  @Get('search')
  @ApiOperation(SearchLeadSwagger.operation)
  @ApiQuery(SearchLeadSwagger.queries.query)
  @ApiQuery(SearchLeadSwagger.queries.location)
  @ApiResponse(SearchLeadSwagger.responses.success)
  @ApiResponse(SearchLeadSwagger.responses.badRequest)
  @ApiResponse(SearchLeadSwagger.responses.internalError)
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
  @ApiOperation(SearchLocationSwagger.operation)
  @ApiQuery(SearchLocationSwagger.queries.query)
  @ApiResponse(SearchLocationSwagger.responses.success)
  @ApiResponse(SearchLocationSwagger.responses.badRequest)
  async searchLocation(@Query('query') query: string, @Res() res: Response) {
    const result = await this.searchLocationUseCase.execute(query)
    return res.status(result.statusCode).json(result)
  }

  @Get('autocomplete')
  @ApiOperation(AutocompleteSwagger.operation)
  @ApiQuery(AutocompleteSwagger.queries.query)
  @ApiQuery(AutocompleteSwagger.queries.country)
  @ApiQuery(AutocompleteSwagger.queries.location)
  @ApiResponse(AutocompleteSwagger.responses.success)
  @ApiResponse(AutocompleteSwagger.responses.badRequest)
  @ApiResponse(AutocompleteSwagger.responses.internalError)
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
  @ApiOperation(GetLeadByIdSwagger.operation)
  @ApiParam(GetLeadByIdSwagger.param)
  @ApiResponse(GetLeadByIdSwagger.responses.success)
  @ApiResponse(GetLeadByIdSwagger.responses.notFound)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.getLeadByIdUseCase.execute(id)
    return res.status(result.statusCode).json(result)
  }

  @Patch(':id')
  @ApiOperation(UpdateLeadSwagger.operation)
  @ApiParam(UpdateLeadSwagger.param)
  @ApiBody(UpdateLeadSwagger.body)
  @ApiResponse(UpdateLeadSwagger.responses.success)
  @ApiResponse(UpdateLeadSwagger.responses.badRequest)
  @ApiResponse(UpdateLeadSwagger.responses.notFound)
  @ApiResponse(UpdateLeadSwagger.responses.conflict)
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
  @ApiOperation(DeleteLeadSwagger.operation)
  @ApiParam(DeleteLeadSwagger.param)
  @ApiResponse(DeleteLeadSwagger.responses.success)
  @ApiResponse(DeleteLeadSwagger.responses.notFound)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.deleteLeadUseCase.execute(id)
    return res.status(result.statusCode).json(result)
  }

  @Post('search-by-criteria')
  @ApiOperation(SearchByCriteriaSwagger.operation)
  @ApiBody(SearchByCriteriaSwagger.body)
  @ApiResponse(SearchByCriteriaSwagger.responses.success)
  @ApiResponse(SearchByCriteriaSwagger.responses.badRequest)
  @ApiResponse(SearchByCriteriaSwagger.responses.internalError)
  async searchLeadsByCriteria(
    @Body() input: SearchLeadsByCriteriaInput,
    @Res() res: Response
  ) {
    const result = await this.searchLeadsByCriteriaUseCase.execute(input)
    return res.status(result.statusCode).json(result)
  }
}
