import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  //Instance of Nest Application
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); //to be able to read cookies
  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    // origin: 'http://localhost:3005',
    origin: [
      'http://localhost:3005',
      'https://staging-capnet-mel.wishtree.tech',
      'https://cap-net-mel-uat.azurewebsites.net',
    ],
  });

  //Configure service for reading variables from different .env configuration files
  const configService = app.get<ConfigService>(ConfigService);
 
  console.log('ENV ', process.env.NODE_ENV);
  console.log('URI', process.env.MONGODB_URI); 
  console.log('PORT ', process.env.PORT);

  // Swagger API Documentation for dev environment
  if (process.env.NODE_ENV === 'dev') {
    //Configure Swagger Module for API documentation
    const config = new DocumentBuilder()
      .setTitle('CAPNET-MEL APIs')
      .setDescription('These are the API routes for CAPNET-MEL application')
      .setVersion('1.0')
      .addTag('APIs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      forbidUnknownValues: false,
    }),
  ); //DTO validations

  const PORT = configService.get('PORT');

  await app.listen(PORT);
}
bootstrap();
