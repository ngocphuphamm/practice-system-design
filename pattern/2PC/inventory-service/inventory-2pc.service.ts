import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { PrepareDto } from '../shared/dtos/prepare.dto';
import { CommitDto } from '../shared/dtos/commit.dto';
import { RollbackDto } from '../shared/dtos/rollback.dto';
import { TwoPhaseResponse } from '../shared/dtos/two-phase.response';
import { TransactionStatus } from '../shared/enums/transaction-status.enum';
import { StructuredLogger } from '../shared/logger/logger.service';

@Injectable()
export class Inventory2PCService {
  private readonly logger: StructuredLogger;

  constructor(
    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepository: Repository<InventoryTransaction>,
  ) {
    this.logger = new StructuredLogger('inventory-2pc-service');
  }

  async prepare(prepareDto: PrepareDto): Promise<TwoPhaseResponse> {
    const { gTid, entityId: productId, amountOrQty: quantity } = prepareDto;

    // Set context for logger
    this.logger.setContext(undefined, undefined, gTid, productId);

    this.logger.log('Inventory prepare phase initiated', `Inventory Prepare ${gTid}`);

    try {
      // Start DB transaction
      const queryRunner = this.inventoryTransactionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Query product stock with pessimistic lock
        const productStock = await queryRunner.manager.query(
          `SELECT stock FROM products WHERE id = ? FOR UPDATE`,
          [productId]
        );

        if (!productStock || productStock[0].stock < quantity) {
          await queryRunner.rollbackTransaction();
          this.logger.warn('Insufficient stock for reservation', `Inventory Prepare ${gTid}`);
          return {
            success: false,
            message: 'Insufficient stock for reservation'
          };
        }

        // Create inventory transaction record with PREPARED status
        const inventoryTransaction = this.inventoryTransactionRepository.create({
          gTid,
          productId,
          quantity,
          status: TransactionStatus.PREPARED,
        });

        await queryRunner.manager.save(inventoryTransaction);

        // Hold inventory stock by updating the product stock
        await queryRunner.manager.query(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [quantity, productId]
        );

        // Commit transaction
        await queryRunner.commitTransaction();
        
        this.logger.log('Inventory prepare completed successfully', `Inventory Prepare ${gTid}`);
        return { success: true };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Inventory preparation failed: ${error.message}`, error.stack, `Inventory Prepare ${gTid}`);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Inventory preparation failed: ${error.message}`, error.stack, `Inventory Prepare ${gTid}`);
      return {
        success: false,
        message: `Inventory preparation failed: ${error.message}`
      };
    }
  }

  async commit(commitDto: CommitDto): Promise<TwoPhaseResponse> {
    const { gTid } = commitDto;

    // Set context for logger
    this.logger.setContext(undefined, undefined, gTid);

    this.logger.log('Inventory commit phase initiated', `Inventory Commit ${gTid}`);

    try {
      // Start DB transaction
      const queryRunner = this.inventoryTransactionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Find the prepared inventory transaction
        const inventoryTransaction = await queryRunner.manager.findOne(InventoryTransaction, {
          where: { gTid, status: TransactionStatus.PREPARED }
        });

        if (!inventoryTransaction) {
          await queryRunner.rollbackTransaction();
          this.logger.warn('Inventory transaction not found in prepared state', `Inventory Commit ${gTid}`);
          return {
            success: false,
            message: 'Inventory transaction not found in prepared state'
          };
        }

        // Update status to COMMITTED and decrease stock
        inventoryTransaction.status = TransactionStatus.COMMITTED;
        await queryRunner.manager.save(inventoryTransaction);

        // Permanently decrement product stock
        await queryRunner.manager.query(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [inventoryTransaction.quantity, inventoryTransaction.productId]
        );

        // Commit transaction
        await queryRunner.commitTransaction();
        
        this.logger.log('Inventory commit completed successfully', `Inventory Commit ${gTid}`);
        return { success: true };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Inventory commit failed: ${error.message}`, error.stack, `Inventory Commit ${gTid}`);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Inventory commit failed: ${error.message}`, error.stack, `Inventory Commit ${gTid}`);
      return {
        success: false,
        message: `Inventory commit failed: ${error.message}`
      };
    }
  }

  async rollback(rollbackDto: RollbackDto): Promise<TwoPhaseResponse> {
    const { gTid } = rollbackDto;

    // Set context for logger
    this.logger.setContext(undefined, undefined, gTid);

    this.logger.log('Inventory rollback phase initiated', `Inventory Rollback ${gTid}`);

    try {
      // Start DB transaction
      const queryRunner = this.inventoryTransactionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Find the prepared inventory transaction
        const inventoryTransaction = await queryRunner.manager.findOne(InventoryTransaction, {
          where: { gTid, status: TransactionStatus.PREPARED }
        });

        if (!inventoryTransaction) {
          await queryRunner.rollbackTransaction();
          this.logger.warn('Inventory transaction not found in prepared state for rollback', `Inventory Rollback ${gTid}`);
          return {
            success: false,
            message: 'Inventory transaction not found in prepared state for rollback'
          };
        }

        // Mark as ABORTED and release reserved stock
        inventoryTransaction.status = TransactionStatus.ABORTED;
        await queryRunner.manager.save(inventoryTransaction);

        // Release reserved stock
        await queryRunner.manager.query(
          `UPDATE products SET stock = stock + ? WHERE id = ?`,
          [inventoryTransaction.quantity, inventoryTransaction.productId]
        );

        // Commit transaction
        await queryRunner.commitTransaction();
        
        this.logger.log('Inventory rollback completed successfully', `Inventory Rollback ${gTid}`);
        return { success: true };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Inventory rollback failed: ${error.message}`, error.stack, `Inventory Rollback ${gTid}`);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Inventory rollback failed: ${error.message}`, error.stack, `Inventory Rollback ${gTid}`);
      return {
        success: false,
        message: `Inventory rollback failed: ${error.message}`
      };
    }
  }
}
