import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Microservice for internal communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 4001, // Port for user-ms
    },
  });

  // Hybrid application (HTTP for public endpoints, TCP for internal communication)
  await app.startAllMicroservices();
  await app.listen(3001); // Port for public HTTP endpoints
  logger.log('User MS is running on port 3001 and microservice on port 4001');
}
bootstrap();
