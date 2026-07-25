import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';
import { TransactionStatus } from '../shared/enums/transaction-status.enum';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepository: Repository<InventoryTransaction>,
  ) {}

  async prepare(prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    const { gTid, entityId: productId, amountOrQty: quantity } = prepareDto;
    
    try {
      // Create a new inventory transaction record with PREPARED status
      const inventoryTransaction = this.inventoryTransactionRepository.create({
        gTid,
        productId,
        quantity,
        status: TransactionStatus.PREPARED,
      });
      
      await this.inventoryTransactionRepository.save(inventoryTransaction);
      
      // In a realistic scenario, we would:
      // 1. Start DB transaction: await this.inventoryTransactionRepository.manager.transaction(...)
      // 2. Query product stock with pessimistic lock: SELECT ... FOR UPDATE
      // 3. Check if stock >= quantity
      // 4. Create inventory_transaction WITH status `PREPARED`
      // 5. Hold inventory stock
      // 6. Commit transaction
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory preparation failed: ${error.message}` 
      };
    }
  }

  async commit(commitDto: CommitDto): Promise<TwoPhaseResponse> {
    const { gTid } = commitDto;
    
    try {
      // Find the prepared inventory transaction
      const inventoryTransaction = await this.inventoryTransactionRepository.findOne({
        where: { gTid, status: TransactionStatus.PREPARED }
      });
      
      if (!inventoryTransaction) {
        return { 
          success: false, 
          message: 'Inventory transaction not found in prepared state' 
        };
      }
      
      // Update status to COMMITTED and decrease stock
      inventoryTransaction.status = TransactionStatus.COMMITTED;
      await this.inventoryTransactionRepository.save(inventoryTransaction);
      
      // In a realistic scenario, we would:
      // 1. Update inventory_transaction status to COMMITTED
      // 2. Permanently decrement product stock
      // 3. Log the successful transaction
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory commit failed: ${error.message}` 
      };
    }
  }

  async rollback(rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    const { gTid } = rollbackDto;
    
    try {
      // Find the prepared inventory transaction
      const inventoryTransaction = await this.inventoryTransactionRepository.findOne({
        where: { gTid, status: TransactionStatus.PREPARED }
      });
      
      if (!inventoryTransaction) {
        return { 
          success: false, 
          message: 'Inventory transaction not found in prepared state for rollback' 
        };
      }
      
      // Mark as ABORTED and release reserved stock
      inventoryTransaction.status = TransactionStatus.ABORTED;
      await this.inventoryTransactionRepository.save(inventoryTransaction);
      
      // In a realistic scenario, we would:
      // 1. Update inventory_transaction status to ABORTED
      // 2. Release reserved stock
      // 3. Log the rollback
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Inventory rollback failed: ${error.message}` 
      };
    }
  }
}