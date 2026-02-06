import { HttpStatus } from '@nestjs/common'
import {
  ApiBodyOptions,
  ApiOperationOptions,
  ApiParamOptions,
  ApiQueryOptions,
  ApiResponseOptions
} from '@nestjs/swagger'
import { CreateLeadDto, UpdateLeadDto } from '../dtos'

export const CreateLeadSwagger = {
  operation: {
    summary: 'Create a new lead',
    description: 'Creates a new lead with the provided data'
  } as ApiOperationOptions,

  body: {
    type: CreateLeadDto
  } as ApiBodyOptions,

  responses: {
    created: {
      status: HttpStatus.CREATED,
      description: 'The lead has been successfully created'
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data'
    } as ApiResponseOptions,

    notFound: {
      status: HttpStatus.NOT_FOUND,
      description: 'Lead category not found'
    } as ApiResponseOptions,

    conflict: {
      status: HttpStatus.CONFLICT,
      description: 'A lead with this company name or email already exists'
    } as ApiResponseOptions
  }
}

export const ListLeadsSwagger = {
  operation: {
    summary: 'Get all leads (paginated)',
    description:
      'Returns a paginated list of leads with optional sorting and search'
  } as ApiOperationOptions,

  queries: {
    page: {
      name: 'page',
      description: 'Page number (1-based)',
      type: 'number',
      required: false,
      example: 1
    } as ApiQueryOptions,
    limit: {
      name: 'limit',
      description: 'Number of items per page (max 100)',
      type: 'number',
      required: false,
      example: 10
    } as ApiQueryOptions,
    sortBy: {
      name: 'sortBy',
      description: 'Field to sort by',
      type: 'string',
      required: false,
      example: 'createdAt'
    } as ApiQueryOptions,
    sortOrder: {
      name: 'sortOrder',
      description: 'Sort order (asc or desc)',
      enum: ['asc', 'desc'],
      required: false,
      example: 'desc'
    } as ApiQueryOptions,
    search: {
      name: 'search',
      description: 'Search term for filtering results',
      type: 'string',
      required: false,
      example: 'empresa'
    } as ApiQueryOptions
  },

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Paginated list of leads retrieved successfully'
    } as ApiResponseOptions
  }
}

export const GetLeadByIdSwagger = {
  operation: {
    summary: 'Get a lead by ID',
    description: 'Returns a single lead by its UUID'
  } as ApiOperationOptions,

  param: {
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  } as ApiParamOptions,

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Lead retrieved successfully'
    } as ApiResponseOptions,

    notFound: {
      status: HttpStatus.NOT_FOUND,
      description: 'Lead not found'
    } as ApiResponseOptions
  }
}

export const UpdateLeadSwagger = {
  operation: {
    summary: 'Update a lead',
    description: 'Updates an existing lead with the provided data'
  } as ApiOperationOptions,

  param: {
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  } as ApiParamOptions,

  body: {
    type: UpdateLeadDto
  } as ApiBodyOptions,

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Lead updated successfully'
    } as ApiResponseOptions,

    badRequest: {
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data'
    } as ApiResponseOptions,

    notFound: {
      status: HttpStatus.NOT_FOUND,
      description: 'Lead not found'
    } as ApiResponseOptions,

    conflict: {
      status: HttpStatus.CONFLICT,
      description: 'A lead with this company name or email already exists'
    } as ApiResponseOptions
  }
}

export const DeleteLeadSwagger = {
  operation: {
    summary: 'Delete a lead',
    description: 'Soft deletes a lead by its UUID'
  } as ApiOperationOptions,

  param: {
    name: 'id',
    description: 'UUID of the lead',
    type: 'string',
    format: 'uuid'
  } as ApiParamOptions,

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'Lead deleted successfully'
    } as ApiResponseOptions,

    notFound: {
      status: HttpStatus.NOT_FOUND,
      description: 'Lead not found'
    } as ApiResponseOptions
  }
}
