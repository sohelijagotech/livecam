import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'bigint', default: 0 })
  coinBalance: number; // purchased currency, spendable on gifts

  @Column({ type: 'bigint', default: 0 })
  diamondBalance: number; // host earnings, withdrawable

  @UpdateDateColumn()
  updatedAt: Date;
}
