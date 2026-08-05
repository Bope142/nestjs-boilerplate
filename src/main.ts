import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppI18nValidationPipe } from './common/i18n/i18n-validation.pipe';
import { getCorsConfig } from './config/cors.config';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  validateEnvironment();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<INestApplication>(AppModule);

  app.use(helmet());
  app.useGlobalFilters(new AllExceptionsFilter());

  const cors = getCorsConfig();
  if (cors.enabled) {
    app.enableCors({
      origin: cors.origins,
      credentials: cors.credentials,
      maxAge: cors.maxAge,
    });
  }

  app.useGlobalPipes(
    new AppI18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix('api');

  const appName = process.env.APP_NAME?.trim() || 'NestJS Boilerplate';
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`${appName} REST API`)
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api/docs-json',
  });

  const port = Number(process.env.PORT);
  await app.listen(port);
  logger.log(`Server is running on http://localhost:${port}`);
  logger.log(`Swagger is running on http://localhost:${port}/api/docs`);
}
void bootstrap();
