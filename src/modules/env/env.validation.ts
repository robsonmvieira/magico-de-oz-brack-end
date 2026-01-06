import { plainToInstance } from 'class-transformer'
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync
} from 'class-validator'

export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.LOCAL

  @IsString()
  DB_HOST: string

  @IsNumber()
  @Min(1)
  DB_PORT: number

  @IsString()
  DB_USERNAME: string

  @IsString()
  DB_PASSWORD: string

  @IsString()
  DB_DATABASE: string

  @IsOptional()
  @IsString()
  DB_LOGGING?: string

  @IsOptional()
  @IsString()
  DATABASE_URL?: string

  @IsString()
  REDIS_HOST: string

  @IsNumber()
  @Min(1)
  REDIS_PORT: number

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string

  @IsString()
  RABBITMQ_URI: string

  @IsString()
  JWT_SECRET: string

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string

  @IsOptional()
  @IsString()
  EMAIL_HOST?: string

  @IsOptional()
  @IsNumber()
  EMAIL_PORT?: number

  @IsOptional()
  @IsString()
  EMAIL_USERNAME?: string

  @IsOptional()
  @IsString()
  EMAIL_PASSWORD?: string

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string

  @IsOptional()
  @IsString()
  AWS_SECRET_KEY?: string

  @IsOptional()
  @IsString()
  AWS_REGION?: string

  @IsOptional()
  @IsString()
  AWS_BUCKET_NAME?: string

  @IsOptional()
  @IsString()
  AWS_URL?: string
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  })

  if (errors.length > 0) {
    const errorMessages = errors
      .map(error => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Invalid value'
        return `${error.property}: ${constraints}`
      })
      .join('\n')

    throw new Error(`Environment validation failed:\n${errorMessages}`)
  }

  return validatedConfig
}
