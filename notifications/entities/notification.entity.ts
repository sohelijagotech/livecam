import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  LIVE_STARTED = 'live_started',
  VIP_EXPIRING = 'vip_expiring',
  COINS_PURCHASED = 'coins_purchased',
  WITHDRAWAL_APPROVED = 'withdrawal_approved',
  NEW_FOLLOWER = 'new_follower',
  PK_INVITATION = 'pk_invitation',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
