import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  COIN_PURCHASE = 'coin_purchase',
  GIFT_SENT = 'gift_sent',
  GIFT_RECEIVED = 'gift_received',
  WITHDRAWAL = 'withdrawal',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'bigint' })
  amount: number; // positive = credit, negative = debit (in coins or diamonds depending on type)

  @Column({ nullable: true })
  currency: string; // 'coin' | 'diamond' | 'fiat'

  @Column({ nullable: true })
  referenceId: string; // e.g. payment provider tx id, gift tx id

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
