import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Gift } from './gift.entity';
import { LiveSession } from '../../live/entities/live-session.entity';

// Platform commission split applied on send: e.g. 50% of coinPrice converts to host diamonds.
const PLATFORM_COMMISSION_RATE = 0.5;

@Entity('gift_transactions')
export class GiftTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;

  @ManyToOne(() => Gift, { onDelete: 'RESTRICT' })
  gift: Gift;

  @ManyToOne(() => LiveSession, { onDelete: 'SET NULL', nullable: true })
  liveSession: LiveSession;

  @Column({ type: 'int' })
  coinPriceAtSend: number;

  @Column({ type: 'int' })
  diamondsCredited: number;

  @CreateDateColumn()
  createdAt: Date;
}

export { PLATFORM_COMMISSION_RATE };
