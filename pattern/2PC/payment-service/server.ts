import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(PaymentModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Set environment variables for proper service identification
  process.env.SERVICE_NAME = 'payment-service';
  process.env.VERSION = '1.0.0';
  
  await app.listen(3001);
  logger.log('Payment Service listening on port 3001');
}

bootstrap();