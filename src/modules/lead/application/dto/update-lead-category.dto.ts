import { PartialType } from '@nestjs/swagger'
import { CreateLeadCategoryDto } from './create-lead-category.dto'

export class UpdateLeadCategoryDto extends PartialType(CreateLeadCategoryDto) {}
