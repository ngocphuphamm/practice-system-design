import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { TransactionStatus } from '../../shared/enums/transaction-status.enum';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  gTid: string;

  @Column()
  productId: string;

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PREPARED
  })
  status: TransactionStatus;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}