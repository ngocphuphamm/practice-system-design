import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';
import { OrderStatus } from '../shared/enums/order-status.enum';
import { TransactionStatus } from '../shared/enums/transaction-status.enum';
import axios from 'axios';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async placeOrder(orderData: {
    userId: string;
    productId: string;
    amount: number;
    quantity: number;
  }): Promise<{ success: boolean; message: string }> {
    // Generate unique global transaction ID
    const gTid = this.generateGtid();
    
    // Create initial order record with PENDING status
    const order = this.orderRepository.create({
      gTid,
      userId: orderData.userId,
      productId: orderData.productId,
      totalAmount: orderData.amount,
      status: OrderStatus.PENDING,
    });
    
    await this.orderRepository.save(order);
    
    try {
      // Phase 1: Prepare phase
      const prepareResults = await Promise.allSettled([
        this.preparePayment(gTid, orderData.userId, orderData.amount),
        this.prepareInventory(gTid, orderData.productId, orderData.quantity),
      ]);
      
      // Phase 2: Decision phase
      const allSuccessful = prepareResults.every(result => 
        result.status === 'fulfilled' && result.value.success
      );
      
      if (allSuccessful) {
        // Execute Commit phase
        const commitResults = await Promise.allSettled([
          this.commitPayment(gTid),
          this.commitInventory(gTid),
        ]);
        
        // Update order status to PAID
        order.status = OrderStatus.PAID;
        await this.orderRepository.save(order);
        
        return { 
          success: true, 
          message: 'Order placed successfully!' 
        };
      } else {
        // Execute Rollback phase
        const rollbackResults = await Promise.allSettled([
          this.rollbackPayment(gTid),
          this.rollbackInventory(gTid),
        ]);
        
        // Update order status to FAILED
        order.status = OrderStatus.FAILED;
        await this.orderRepository.save(order);
        
        return { 
          success: false, 
          message: 'Transaction aborted due to participant failure.' 
        };
      }
    } catch (error) {
      // In case of system errors, ensure rollback
      try {
        await this.rollbackPayment(gTid);
        await this.rollbackInventory(gTid);
        
        // Update order status to FAILED
        order.status = OrderStatus.FAILED;
        await this.orderRepository.save(order);
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
      
      return { 
        success: false, 
        message: `System error occurred: ${error.message}` 
      };
    }
  }
  
  private generateGtid(): string {
    // Simple UUID generation for demo purposes
    return 'gtid-' + Math.random().toString(36).substr(2, 9);
  }
  
  private async preparePayment(gTid: string, userId: string, amount: number): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3001/payment/prepare', {
        gTid,
        entityId: userId,
        amountOrQty: amount
      });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Payment prepare failed: ${error.message}` 
      };
    }
  }
  
  private async prepareInventory(gTid: string, productId: string, quantity: number): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3002/inventory/prepare', {
        gTid,
        entityId: productId,
        amountOrQty: quantity
      });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory prepare failed: ${error.message}` 
      };
    }
  }
  
  private async commitPayment(gTid: string): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3001/payment/commit', { gTid });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Payment commit failed: ${error.message}` 
      };
    }
  }
  
  private async commitInventory(gTid: string): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3002/inventory/commit', { gTid });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory commit failed: ${error.message}` 
      };
    }
  }
  
  private async rollbackPayment(gTid: string): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3001/payment/rollback', { gTid });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Payment rollback failed: ${error.message}` 
      };
    }
  }
  
  private async rollbackInventory(gTid: string): Promise<TwoPhaseResponse> {
    try {
      const response = await axios.post('http://localhost:3002/inventory/rollback', { gTid });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory rollback failed: ${error.message}` 
      };
    }
  }
}