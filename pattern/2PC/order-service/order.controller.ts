import { Controller, Post, Body } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async placeOrder(@Body() orderData: {
    userId: string;
    productId: string;
    amount: number;
    quantity: number;
  }) {
    return this.orderService.placeOrder(orderData);
  }
}