import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const config = new DocumentBuilder()
    .setTitle('Mágico de Oz CRM API')
    .setDescription('API for managing leads and CRM operations')
    .setVersion('1.0')
    .addTag('Lead Categories', 'Operations related to lead categories')
    .addTag('Leads', 'Operations related to leads')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(3000)
  console.log(`Application is running on: ${await app.getUrl()}`)
  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`
  )
}
bootstrap()
