import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { TransactionStatus } from '../../shared/enums/transaction-status.enum';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  gTid: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PREPARED
  })
  status: TransactionStatus;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}