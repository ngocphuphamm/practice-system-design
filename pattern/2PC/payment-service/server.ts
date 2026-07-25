import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(PaymentModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3001);
  logger.log('Payment Service listening on port 3001');
}

bootstrap();