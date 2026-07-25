import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';
import { TransactionStatus } from '../shared/enums/transaction-status.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,
  ) {}

  async prepare(prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    const { gTid, entityId: userId, amountOrQty: amount } = prepareDto;
    
    // Start transaction - we'll handle this through TypeORM transaction manager
    
    try {
      // For simplicity in this example, let's assume a user entity exists
      // In a real implementation, we would check actual user balance
      
      // Create a new payment transaction record with PREPARED status
      const paymentTransaction = this.paymentTransactionRepository.create({
        gTid,
        userId,
        amount,
        status: TransactionStatus.PREPARED,
      });
      
      await this.paymentTransactionRepository.save(paymentTransaction);
      
      // In a realistic scenario, we would:
      // 1. Start DB transaction: await this.paymentTransactionRepository.manager.transaction(...)
      // 2. Query user balance with pessimistic lock: SELECT ... FOR UPDATE
      // 3. Check if balance >= amount
      // 4. Create payment_transaction WITH status `PREPARED`
      // 5. Deduct soft-locked balance (or hold amount)
      // 6. Commit transaction
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Payment preparation failed: ${error.message}` 
      };
    }
  }

  async commit(commitDto: CommitDto): Promise<TwoPhaseResponse> {
    const { gTid } = commitDto;
    
    try {
      // Find the prepared payment transaction
      const paymentTransaction = await this.paymentTransactionRepository.findOne({
        where: { gTid, status: TransactionStatus.PREPARED }
      });
      
      if (!paymentTransaction) {
        return { 
          success: false, 
          message: 'Payment transaction not found in prepared state' 
        };
      }
      
      // Update status to COMMITTED and release held balance
      paymentTransaction.status = TransactionStatus.COMMITTED;
      await this.paymentTransactionRepository.save(paymentTransaction);
      
      // In a realistic scenario, we would:
      // 1. Update payment_transaction status to COMMITTED
      // 2. Release held balance / perform actual deduction
      // 3. Log the successful transaction
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Payment commit failed: ${error.message}` 
      };
    }
  }

  async rollback(rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    const { gTid } = rollbackDto;
    
    try {
      // Find the prepared payment transaction
      const paymentTransaction = await this.paymentTransactionRepository.findOne({
        where: { gTid, status: TransactionStatus.PREPARED }
      });
      
      if (!paymentTransaction) {
        return { 
          success: false, 
          message: 'Payment transaction not found in prepared state for rollback' 
        };
      }
      
      // Mark as ABORTED and release held balance
      paymentTransaction.status = TransactionStatus.ABORTED;
      await this.paymentTransactionRepository.save(paymentTransaction);
      
      // In a realistic scenario, we would:
      // 1. Update payment_transaction status to ABORTED
      // 2. Release held balance / undo any hold
      // 3. Log the rollback
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Payment rollback failed: ${error.message}` 
      };
    }
  }
}