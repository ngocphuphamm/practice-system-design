import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(OrderModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Set environment variables for proper service identification
  process.env.SERVICE_NAME = 'order-service';
  process.env.VERSION = '1.0.0';
  
  await app.listen(3003);
  logger.log('Order Service listening on port 3003');
}

bootstrap();