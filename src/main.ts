import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';
import { LoggerFactory } from './core/logger-factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory('cron_app'),
  });
  app.enableCors();
  app.setGlobalPrefix('cron');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const config = app.get<ConfigService<Config, true>>(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cron Service')
    .setDescription('Service for running cron processes')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/cron/docs', app, document);

  await app.listen(config.get<number>('port'));
}
bootstrap();
