import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Microservice for internal communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 4005, // Port for payment-ms microservice
    },
  });

  // Hybrid application (HTTP for public endpoints, TCP for internal communication)
  await app.startAllMicroservices();

  const port = process.env.PORT || 3005;
  await app.listen(port);
  logger.log(
    `Payment MS is running on port ${port} and microservice on port 4005`,
  );
}
bootstrap(); 