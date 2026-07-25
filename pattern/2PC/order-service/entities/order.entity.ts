import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { OrderStatus } from '../../shared/enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  gTid: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}