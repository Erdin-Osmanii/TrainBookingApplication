import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);

  // Microservice for internal communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 4003, // Port for inventory-ms
    },
  });

  // Hybrid application (HTTP for availability, TCP for seats)
  await app.startAllMicroservices();
  await app.listen(3003); // Port for public HTTP endpoints
  logger.log(
    'Inventory MS is running on port 3003 and microservice on port 4003',
  );
}
bootstrap();
