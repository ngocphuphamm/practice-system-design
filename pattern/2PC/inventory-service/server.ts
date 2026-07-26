import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('InventoryService');
  const app = await NestFactory.create(InventoryModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Set environment variables for proper service identification
  process.env.SERVICE_NAME = 'inventory-service';
  process.env.VERSION = '1.0.0';
  
  await app.listen(3002);
  logger.log('Inventory Service listening on port 3002');
}

bootstrap();