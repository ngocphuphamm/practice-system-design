import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(OrderModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3003);
  logger.log('Order Service listening on port 3003');
}

bootstrap();