import { HttpStatus } from '@nestjs/common'
import {
  ApiBodyOptions,
  ApiOperationOptions,
  ApiParamOptions,
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
    summary: 'Get all leads',
    description: 'Returns a list of all leads'
  } as ApiOperationOptions,

  responses: {
    success: {
      status: HttpStatus.OK,
      description: 'List of leads retrieved successfully'
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
