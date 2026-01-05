import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Environment, EnvironmentVariables } from './env.validation'

@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>
  ) {}

  get nodeEnv(): Environment {
    return this.configService.get('NODE_ENV', { infer: true })
  }

  get isProduction(): boolean {
    return this.nodeEnv === Environment.PRODUCTION
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.DEVELOPMENT
  }

  get isLocal(): boolean {
    return this.nodeEnv === Environment.LOCAL
  }

  get isTest(): boolean {
    return this.nodeEnv === Environment.TEST
  }

  // Database
  get dbHost(): string {
    return this.configService.get('DB_HOST', { infer: true })
  }

  get dbPort(): number {
    return this.configService.get('DB_PORT', { infer: true })
  }

  get dbUsername(): string {
    return this.configService.get('DB_USERNAME', { infer: true })
  }

  get dbPassword(): string {
    return this.configService.get('DB_PASSWORD', { infer: true })
  }

  get dbDatabase(): string {
    return this.configService.get('DB_DATABASE', { infer: true })
  }

  get dbLogging(): boolean {
    const logging = this.configService.get('DB_LOGGING', { infer: true })
    return logging === 'true'
  }

  // Redis
  get redisHost(): string {
    return this.configService.get('REDIS_HOST', { infer: true })
  }

  get redisPort(): number {
    return this.configService.get('REDIS_PORT', { infer: true })
  }

  get redisPassword(): string | undefined {
    return this.configService.get('REDIS_PASSWORD', { infer: true })
  }

  // RabbitMQ
  get rabbitmqUri(): string {
    return this.configService.get('RABBITMQ_URI', { infer: true })
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true })
  }

  get jwtExpiresIn(): string {
    return this.configService.get('JWT_EXPIRES_IN', { infer: true }) ?? '8h'
  }

  // Email
  get emailHost(): string | undefined {
    return this.configService.get('EMAIL_HOST', { infer: true })
  }

  get emailPort(): number | undefined {
    return this.configService.get('EMAIL_PORT', { infer: true })
  }

  get emailUsername(): string | undefined {
    return this.configService.get('EMAIL_USERNAME', { infer: true })
  }

  get emailPassword(): string | undefined {
    return this.configService.get('EMAIL_PASSWORD', { infer: true })
  }

  // AWS
  get awsAccessKeyId(): string | undefined {
    return this.configService.get('AWS_ACCESS_KEY_ID', { infer: true })
  }

  get awsSecretKey(): string | undefined {
    return this.configService.get('AWS_SECRET_KEY', { infer: true })
  }

  get awsRegion(): string | undefined {
    return this.configService.get('AWS_REGION', { infer: true })
  }

  get awsBucketName(): string | undefined {
    return this.configService.get('AWS_BUCKET_NAME', { infer: true })
  }

  get awsUrl(): string | undefined {
    return this.configService.get('AWS_URL', { infer: true })
  }

  // Database connection config object (útil para TypeORM)
  get databaseConfig() {
    return {
      host: this.dbHost,
      port: this.dbPort,
      username: this.dbUsername,
      password: this.dbPassword,
      database: this.dbDatabase,
      logging: this.dbLogging
    }
  }

  // Redis connection config object
  get redisConfig() {
    return {
      host: this.redisHost,
      port: this.redisPort,
      password: this.redisPassword
    }
  }
}
